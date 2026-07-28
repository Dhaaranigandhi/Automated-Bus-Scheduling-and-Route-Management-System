"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFuelLog = exports.getAllFuelLogs = exports.fuelLogSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod schemas
exports.fuelLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        busId: zod_1.z.number().int(),
        fuelQuantity: zod_1.z.number().min(0.1),
        odometerReading: zod_1.z.number().min(1),
        cost: zod_1.z.number().min(0),
        date: zod_1.z.string().transform((str) => new Date(str)),
    }),
});
const getAllFuelLogs = async (req, res, next) => {
    try {
        const logs = await prisma_1.default.fuelLog.findMany({
            include: { bus: true },
            orderBy: { date: 'desc' },
        });
        res.status(200).json({
            success: true,
            logs,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllFuelLogs = getAllFuelLogs;
const createFuelLog = async (req, res, next) => {
    try {
        const { busId, fuelQuantity, odometerReading, cost, date } = req.body;
        const bus = await prisma_1.default.bus.findUnique({ where: { id: busId } });
        if (!bus) {
            throw new error_1.ApiError(404, 'Bus vehicle not found');
        }
        // Verify odometer sequence (should not decrease)
        const lastLog = await prisma_1.default.fuelLog.findFirst({
            where: { busId },
            orderBy: { odometerReading: 'desc' },
        });
        if (lastLog && odometerReading < Number(lastLog.odometerReading)) {
            throw new error_1.ApiError(400, `Odometer reading cannot be lower than the previous logged value (${lastLog.odometerReading} km)`);
        }
        const log = await prisma_1.default.fuelLog.create({
            data: {
                busId,
                fuelQuantity,
                odometerReading,
                cost,
                date,
            },
        });
        res.status(201).json({
            success: true,
            log,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createFuelLog = createFuelLog;
