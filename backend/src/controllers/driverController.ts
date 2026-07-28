import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod validation schemas
export const driverCreateSchema = z.object({
  body: z.object({
    userId: z.number().int().optional(),
    licenseNumber: z.string().min(5, 'Provide a valid license number'),
    licenseExpiry: z.string().transform((str) => new Date(str)),
    medicalStatus: z.string().optional(),
    availabilityStatus: z.enum(['AVAILABLE', 'ON_DUTY', 'OFF_DUTY', 'SUSPENDED']).optional(),
  }),
});

export const attendanceLogSchema = z.object({
  body: z.object({
    passengerId: z.number().int().optional(),
    driverId: z.number().int().optional(),
    tripId: z.number().int().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
    checkInTime: z.string().transform((str) => new Date(str)),
    checkOutTime: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  }),
});

export const getAllDrivers = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { availability, search } = req.query;

    const whereClause: any = {};
    if (availability) whereClause.availabilityStatus = availability as string;
    if (search) {
      whereClause.OR = [
        { licenseNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      drivers,
    });
  } catch (err) {
    next(err);
  }
};

export const getDriverById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    if (isNaN(driverId)) {
      throw new ApiError(400, 'Invalid driver identifier');
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        documents: true,
        attendances: true,
        schedules: {
          include: { route: true, bus: true },
        },
      },
    });

    if (!driver) {
      throw new ApiError(404, 'Driver profile not found');
    }

    res.status(200).json({
      success: true,
      driver,
    });
  } catch (err) {
    next(err);
  }
};

export const createDriver = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { userId, licenseNumber, licenseExpiry, medicalStatus, availabilityStatus } = req.body;

    const existingDriver = await prisma.driver.findUnique({
      where: { licenseNumber },
    });

    if (existingDriver) {
      throw new ApiError(400, 'A driver with this license number already exists');
    }

    if (userId) {
      const userLink = await prisma.driver.findUnique({ where: { userId } });
      if (userLink) {
        throw new ApiError(400, 'The selected user account is already linked to a driver profile');
      }
    }

  const driver = await prisma.driver.create({
   data: {
    userId,
    licenseNumber,
    licenseExpiry: new Date(licenseExpiry),
    medicalStatus,
    availabilityStatus: availabilityStatus || 'AVAILABLE',
  },
});

    res.status(201).json({
      success: true,
      driver,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDriver = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    const { licenseNumber, licenseExpiry, medicalStatus, availabilityStatus, performanceScore } = req.body;

    if (isNaN(driverId)) {
      throw new ApiError(400, 'Invalid driver identifier');
    }

    const driverRecord = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driverRecord) {
      throw new ApiError(404, 'Driver profile not found');
    }

    if (licenseNumber && licenseNumber !== driverRecord.licenseNumber) {
      const licenseDup = await prisma.driver.findUnique({ where: { licenseNumber } });
      if (licenseDup) {
        throw new ApiError(400, 'License number belongs to another active driver record');
      }
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        licenseNumber,
        licenseExpiry,
        medicalStatus,
        availabilityStatus,
        performanceScore,
      },
    });

    res.status(200).json({
      success: true,
      driver: updatedDriver,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDriver = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    if (isNaN(driverId)) {
      throw new ApiError(400, 'Invalid driver identifier');
    }

    const driverRecord = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driverRecord) {
      throw new ApiError(404, 'Driver profile not found');
    }

    // Check schedules dependency
    const activeSchedule = await prisma.schedule.findFirst({
      where: { driverId, status: 'ACTIVE' },
    });
    if (activeSchedule) {
      throw new ApiError(400, 'Cannot delete driver currently assigned to active transit runs');
    }

    await prisma.driver.delete({
      where: { id: driverId },
    });

    res.status(200).json({
      success: true,
      message: 'Driver profile deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const logAttendance = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { passengerId, driverId, tripId, status, checkInTime, checkOutTime } = req.body;

    if (!passengerId && !driverId) {
      throw new ApiError(400, 'Either passengerId or driverId must be specified for attendance logging');
    }

    const attendance = await prisma.attendance.create({
      data: {
        date: new Date(),
        checkInTime,
        checkOutTime,
        status,
        passengerId,
        driverId,
        tripId,
      },
    });

    res.status(201).json({
      success: true,
      attendance,
    });
  } catch (err) {
    next(err);
  }
};
