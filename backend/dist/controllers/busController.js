"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBusDocument = exports.deleteBus = exports.updateBus = exports.createBus = exports.getBusById = exports.getAllBuses = exports.documentUploadSchema = exports.busCreateSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod Validation schemas
exports.busCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        registrationNumber: zod_1.z.string().min(3, 'Registration number must be valid'),
        model: zod_1.z.string().min(2, 'Model name is required'),
        capacity: zod_1.z.number().int().min(1, 'Capacity must be at least 1 seat'),
        status: zod_1.z.enum(['AVAILABLE', 'RUNNING', 'MAINTENANCE', 'INACTIVE']).optional(),
        category: zod_1.z.enum(['AC_SEATER', 'NON_AC_SEATER', 'AC_SLEEPER', 'NON_AC_SLEEPER']).optional(),
    }),
});
exports.documentUploadSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2, 'Document title is required'),
        documentType: zod_1.z.enum(['PERMIT', 'FITNESS', 'INSURANCE', 'LICENSE']),
        fileUrl: zod_1.z.string().url('File URL must be a valid location link'),
        expiryDate: zod_1.z.string().transform((str) => new Date(str)),
    }),
});
const getAllBuses = async (req, res, next) => {
    try {
        const { status, category, search } = req.query;
        const whereClause = {};
        if (status)
            whereClause.status = status;
        if (category)
            whereClause.category = category;
        if (search) {
            whereClause.OR = [
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
            ];
        }
        const buses = await prisma_1.default.bus.findMany({
            where: whereClause,
            include: {
                documents: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            buses,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllBuses = getAllBuses;
const getBusById = async (req, res, next) => {
    try {
        const busId = parseInt(req.params.id, 10);
        if (isNaN(busId)) {
            throw new error_1.ApiError(400, 'Invalid bus identifier');
        }
        const bus = await prisma_1.default.bus.findUnique({
            where: { id: busId },
            include: {
                documents: true,
                maintenances: true,
                fuelLogs: true,
                schedules: {
                    include: {
                        route: true,
                        driver: {
                            include: { user: true },
                        },
                    },
                },
            },
        });
        if (!bus) {
            throw new error_1.ApiError(404, 'Bus vehicle not found');
        }
        res.status(200).json({
            success: true,
            bus,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getBusById = getBusById;
const createBus = async (req, res, next) => {
    try {
        const { registrationNumber, model, capacity, status, category } = req.body;
        const existingBus = await prisma_1.default.bus.findUnique({
            where: { registrationNumber },
        });
        if (existingBus) {
            throw new error_1.ApiError(400, 'A bus with this registration number already exists');
        }
        const bus = await prisma_1.default.bus.create({
            data: {
                registrationNumber,
                model,
                capacity,
                status: status || 'AVAILABLE',
                category: category || 'NON_AC_SEATER',
            },
        });
        // Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'CREATE_BUS',
                details: `Created vehicle DL-${registrationNumber} (ID: ${bus.id})`,
            },
        });
        res.status(201).json({
            success: true,
            bus,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createBus = createBus;
const updateBus = async (req, res, next) => {
    try {
        const busId = parseInt(req.params.id, 10);
        const { registrationNumber, model, capacity, status, category } = req.body;
        if (isNaN(busId)) {
            throw new error_1.ApiError(400, 'Invalid bus identifier');
        }
        // Verify status transition
        const busRecord = await prisma_1.default.bus.findUnique({ where: { id: busId } });
        if (!busRecord) {
            throw new error_1.ApiError(404, 'Bus vehicle not found');
        }
        if (registrationNumber && registrationNumber !== busRecord.registrationNumber) {
            const regDup = await prisma_1.default.bus.findUnique({ where: { registrationNumber } });
            if (regDup) {
                throw new error_1.ApiError(400, 'Another bus already uses this registration number');
            }
        }
        const updatedBus = await prisma_1.default.bus.update({
            where: { id: busId },
            data: {
                registrationNumber,
                model,
                capacity,
                status,
                category,
            },
        });
        // Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'UPDATE_BUS',
                details: `Updated vehicle properties for ID: ${busId}`,
            },
        });
        res.status(200).json({
            success: true,
            bus: updatedBus,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateBus = updateBus;
const deleteBus = async (req, res, next) => {
    try {
        const busId = parseInt(req.params.id, 10);
        if (isNaN(busId)) {
            throw new error_1.ApiError(400, 'Invalid bus identifier');
        }
        const busRecord = await prisma_1.default.bus.findUnique({ where: { id: busId } });
        if (!busRecord) {
            throw new error_1.ApiError(404, 'Bus vehicle not found');
        }
        // Restrict deletion if bus is actively referenced in schedules
        const activeSchedule = await prisma_1.default.schedule.findFirst({
            where: { busId, status: 'ACTIVE' },
        });
        if (activeSchedule) {
            throw new error_1.ApiError(400, 'Cannot delete a bus that is currently assigned to an active schedule');
        }
        await prisma_1.default.bus.delete({
            where: { id: busId },
        });
        // Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'DELETE_BUS',
                details: `Deleted vehicle registration: ${busRecord.registrationNumber}`,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Bus deleted successfully',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteBus = deleteBus;
const uploadBusDocument = async (req, res, next) => {
    try {
        const busId = parseInt(req.params.id, 10);
        if (isNaN(busId)) {
            throw new error_1.ApiError(400, 'Invalid bus identifier');
        }
        const bus = await prisma_1.default.bus.findUnique({ where: { id: busId } });
        if (!bus) {
            throw new error_1.ApiError(404, 'Bus vehicle not found');
        }
        const { title, documentType, fileUrl, expiryDate } = req.body;
        const doc = await prisma_1.default.document.create({
            data: {
                title,
                documentType,
                fileUrl,
                expiryDate,
                busId,
            },
        });
        res.status(201).json({
            success: true,
            document: doc,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadBusDocument = uploadBusDocument;
