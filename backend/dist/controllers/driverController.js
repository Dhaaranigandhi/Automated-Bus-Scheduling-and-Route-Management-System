"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAttendance = exports.deleteDriver = exports.updateDriver = exports.createDriver = exports.getDriverById = exports.getAllDrivers = exports.attendanceLogSchema = exports.driverCreateSchema = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod validation schemas
exports.driverCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.number().int().optional(),
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
        email: zod_1.z.string().email('Provide a valid email address').optional(),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters').optional(),
        licenseNumber: zod_1.z.string().min(5, 'Provide a valid license number'),
        licenseExpiry: zod_1.z.string().transform((str) => new Date(str)),
        medicalStatus: zod_1.z.string().optional(),
        availabilityStatus: zod_1.z.enum(['AVAILABLE', 'ON_DUTY', 'OFF_DUTY', 'SUSPENDED']).optional(),
    }),
});
exports.attendanceLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        passengerId: zod_1.z.number().int().optional(),
        driverId: zod_1.z.number().int().optional(),
        tripId: zod_1.z.number().int().optional(),
        status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE']),
        checkInTime: zod_1.z.string().transform((str) => new Date(str)),
        checkOutTime: zod_1.z.string().optional().transform((str) => str ? new Date(str) : undefined),
    }),
});
const getAllDrivers = async (req, res, next) => {
    try {
        const { availability, search } = req.query;
        const whereClause = {};
        if (availability)
            whereClause.availabilityStatus = availability;
        if (search) {
            whereClause.OR = [
                { licenseNumber: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const drivers = await prisma_1.default.driver.findMany({
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
    }
    catch (err) {
        next(err);
    }
};
exports.getAllDrivers = getAllDrivers;
const getDriverById = async (req, res, next) => {
    try {
        const driverId = parseInt(req.params.id, 10);
        if (isNaN(driverId)) {
            throw new error_1.ApiError(400, 'Invalid driver identifier');
        }
        const driver = await prisma_1.default.driver.findUnique({
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
            throw new error_1.ApiError(404, 'Driver profile not found');
        }
        res.status(200).json({
            success: true,
            driver,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDriverById = getDriverById;
const createDriver = async (req, res, next) => {
    try {
        const { userId, name, email, password, licenseNumber, licenseExpiry, medicalStatus, availabilityStatus } = req.body;
        if (!userId && (!name || !email || !password)) {
            throw new error_1.ApiError(400, 'Specify userId, or provide name, email, and password to create a new driver user');
        }
        const existingDriver = await prisma_1.default.driver.findUnique({
            where: { licenseNumber },
        });
        if (existingDriver) {
            throw new error_1.ApiError(400, 'A driver with this license number already exists');
        }
        let finalUserId = userId;
        if (!finalUserId) {
            const existingUser = await prisma_1.default.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                throw new error_1.ApiError(400, 'A user account with this email address already exists');
            }
            const driverRole = await prisma_1.default.role.findUnique({
                where: { name: 'Driver' }
            });
            if (!driverRole) {
                throw new error_1.ApiError(500, 'Driver role not configured in the system');
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(password, salt);
            const driver = await prisma_1.default.$transaction(async (tx) => {
                const dbUser = await tx.user.create({
                    data: {
                        name: name,
                        email: email,
                        password: passwordHash,
                        roleId: driverRole.id
                    }
                });
                return await tx.driver.create({
                    data: {
                        userId: dbUser.id,
                        licenseNumber,
                        licenseExpiry: new Date(licenseExpiry),
                        medicalStatus,
                        availabilityStatus: availabilityStatus || 'AVAILABLE',
                    }
                });
            });
            res.status(201).json({
                success: true,
                driver,
            });
            return;
        }
        const userLink = await prisma_1.default.driver.findUnique({ where: { userId: finalUserId } });
        if (userLink) {
            throw new error_1.ApiError(400, 'The selected user account is already linked to a driver profile');
        }
        const driver = await prisma_1.default.driver.create({
            data: {
                userId: finalUserId,
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
    }
    catch (err) {
        next(err);
    }
};
exports.createDriver = createDriver;
const updateDriver = async (req, res, next) => {
    try {
        const driverId = parseInt(req.params.id, 10);
        const { licenseNumber, licenseExpiry, medicalStatus, availabilityStatus, performanceScore } = req.body;
        if (isNaN(driverId)) {
            throw new error_1.ApiError(400, 'Invalid driver identifier');
        }
        const driverRecord = await prisma_1.default.driver.findUnique({ where: { id: driverId } });
        if (!driverRecord) {
            throw new error_1.ApiError(404, 'Driver profile not found');
        }
        if (licenseNumber && licenseNumber !== driverRecord.licenseNumber) {
            const licenseDup = await prisma_1.default.driver.findUnique({ where: { licenseNumber } });
            if (licenseDup) {
                throw new error_1.ApiError(400, 'License number belongs to another active driver record');
            }
        }
        const updatedDriver = await prisma_1.default.driver.update({
            where: { id: driverId },
            data: {
                licenseNumber,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
                medicalStatus,
                availabilityStatus,
                performanceScore: performanceScore !== undefined ? Number(performanceScore) : undefined,
            },
        });
        res.status(200).json({
            success: true,
            driver: updatedDriver,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateDriver = updateDriver;
const deleteDriver = async (req, res, next) => {
    try {
        const driverId = parseInt(req.params.id, 10);
        if (isNaN(driverId)) {
            throw new error_1.ApiError(400, 'Invalid driver identifier');
        }
        const driverRecord = await prisma_1.default.driver.findUnique({ where: { id: driverId } });
        if (!driverRecord) {
            throw new error_1.ApiError(404, 'Driver profile not found');
        }
        // Check schedules dependency
        const activeSchedule = await prisma_1.default.schedule.findFirst({
            where: { driverId, status: 'ACTIVE' },
        });
        if (activeSchedule) {
            throw new error_1.ApiError(400, 'Cannot delete driver currently assigned to active transit runs');
        }
        await prisma_1.default.driver.delete({
            where: { id: driverId },
        });
        res.status(200).json({
            success: true,
            message: 'Driver profile deleted successfully',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteDriver = deleteDriver;
const logAttendance = async (req, res, next) => {
    try {
        const { passengerId, driverId, tripId, status, checkInTime, checkOutTime } = req.body;
        if (!passengerId && !driverId) {
            throw new error_1.ApiError(400, 'Either passengerId or driverId must be specified for attendance logging');
        }
        const attendance = await prisma_1.default.attendance.create({
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
    }
    catch (err) {
        next(err);
    }
};
exports.logAttendance = logAttendance;
