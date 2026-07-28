import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';
import cache from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'transitflow_jwt_access_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'transitflow_jwt_refresh_secret_key_2026';

// Zod Validation schemas
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    roleName: z.string().min(1, 'Role is required'),
    passengerType: z.string().optional(), // STUDENT, FACULTY, EMPLOYEE, PUBLIC
    idCardNumber: z.string().optional(),
    rollNumber: z.string().optional(),
    employeeId: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    batch: z.string().optional(),
  }),
});

export const login = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid email or password combination');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Invalid email or password combination');
    }

    // Generate short-lived Access token (15 mins) and sliding Refresh token (7 days)
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role.name }, JWT_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    // Cache refresh token in Redis/memory store for rotation tracking
    await cache.set(`refToken:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    // Set refresh token in HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log action to audits
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        ipAddress: req.ip,
        details: `User logged in from IP ${req.ip}`,
      },
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signup = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const {
      email,
      password,
      name,
      roleName,
      passengerType,
      idCardNumber,
      rollNumber,
      employeeId,
      department,
      designation,
      batch,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(400, 'Email address is already registered');
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new ApiError(400, `The role '${roleName}' does not exist inside the system`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          name,
          roleId: role.id,
        },
      });

      // If user is a Passenger, create the profile
      if (['Student/Passenger', 'Faculty/Employee'].includes(roleName)) {
        const pass = await tx.passenger.create({
          data: {
            userId: user.id,
            passengerType: passengerType || (roleName === 'Student/Passenger' ? 'STUDENT' : 'EMPLOYEE'),
            idCardNumber,
          },
        });

        if (pass.passengerType === 'STUDENT' && rollNumber) {
          await tx.student.create({
            data: {
              passengerId: pass.id,
              rollNumber,
              department: department || 'General',
              batch: batch || '2026',
            },
          });
        } else if (pass.passengerType === 'EMPLOYEE' && employeeId) {
          await tx.employee.create({
            data: {
              passengerId: pass.id,
              employeeId,
              designation: designation || 'Staff',
              department: department || 'General',
            },
          });
        }
      }

      return user;
    });

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_SIGNUP',
        ipAddress: req.ip,
        details: `User registered account under role: ${roleName}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: role.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cookiesToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!cookiesToken) {
      throw new ApiError(401, 'Unauthorized: Refresh token is missing');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(cookiesToken, JWT_REFRESH_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Unauthorized: Refresh token expired or was modified');
    }

    // Verify refresh token matching cached index to prevent replay exploits
    const cachedToken = await cache.get(`refToken:${decoded.id}`);
    if (!cachedToken || cachedToken !== cookiesToken) {
      throw new ApiError(401, 'Unauthorized: Session has been terminated or token is invalid');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user) {
      throw new ApiError(401, 'Unauthorized: User does not exist');
    }

    // Rotate both access & refresh tokens
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role.name }, JWT_SECRET, {
      expiresIn: '15m',
    });

    const newRefreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    // Update Cache
    await cache.set(`refToken:${user.id}`, newRefreshToken, 7 * 24 * 60 * 60);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await cache.del(`refToken:${userId}`);
    }

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        driver: true,
        passenger: {
          include: {
            student: true,
            employee: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        driverProfile: user.driver,
        passengerProfile: user.passenger,
      },
    });
  } catch (err) {
    next(err);
  }
};
