"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaintenanceStatus = exports.createMaintenance = exports.getAllMaintenances = exports.maintenanceCreateSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod schemas
exports.maintenanceCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        busId: zod_1.z.number().int(),
        maintenanceType: zod_1.z.enum(['ROUTINE', 'REPAIR', 'INSPECTION']),
        description: zod_1.z.string().min(3),
        cost: zod_1.z.number().min(0),
        scheduledDate: zod_1.z.string().transform((str) => new Date(str)),
    }),
});
const getAllMaintenances = async (req, res, next) => {
    try {
        const records = await prisma_1.default.maintenance.findMany({
            include: { bus: true },
            orderBy: { scheduledDate: 'desc' },
        });
        res.status(200).json({
            success: true,
            records,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllMaintenances = getAllMaintenances;
const createMaintenance = async (req, res, next) => {
    try {
        const { busId, maintenanceType, description, cost, scheduledDate } = req.body;
        const bus = await prisma_1.default.bus.findUnique({ where: { id: busId } });
        if (!bus) {
            throw new error_1.ApiError(404, 'Bus vehicle not found');
        }
        const record = await prisma_1.default.maintenance.create({
            data: {
                busId,
                maintenanceType,
                description,
                cost,
                scheduledDate,
                status: 'SCHEDULED',
            },
        });
        // Mark bus status as in maintenance
        await prisma_1.default.bus.update({
            where: { id: busId },
            data: { status: 'MAINTENANCE' },
        });
        res.status(201).json({
            success: true,
            record,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createMaintenance = createMaintenance;
const updateMaintenanceStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { status, completedDate } = req.body;
        if (isNaN(id)) {
            throw new error_1.ApiError(400, 'Invalid maintenance identifier');
        }
        const record = await prisma_1.default.maintenance.findUnique({ where: { id } });
        if (!record) {
            throw new error_1.ApiError(404, 'Maintenance log not found');
        }
        const updated = await prisma_1.default.maintenance.update({
            where: { id },
            data: {
                status,
                completedDate: status === 'COMPLETED' ? (completedDate ? new Date(completedDate) : new Date()) : null,
            },
        });
        // If completed, release the bus status back to AVAILABLE
        if (status === 'COMPLETED') {
            await prisma_1.default.bus.update({
                where: { id: record.busId },
                data: { status: 'AVAILABLE' },
            });
        }
        res.status(200).json({
            success: true,
            record: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateMaintenanceStatus = updateMaintenanceStatus;
