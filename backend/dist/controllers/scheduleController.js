"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIScheduleRecommendation = exports.deleteSchedule = exports.updateSchedule = exports.createSchedule = exports.getScheduleById = exports.getAllSchedules = exports.scheduleCreateSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod Validation schemas
exports.scheduleCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        routeId: zod_1.z.number().int(),
        busId: zod_1.z.number().int(),
        driverId: zod_1.z.number().int(),
        departureTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure must be in HH:MM format'),
        recurrence: zod_1.z.enum(['DAILY', 'WEEKDAYS', 'WEEKENDS', 'HOLIDAYS']).optional(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
});
// Helper to convert time strings "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}
// Overlap validation helper
function hasOverlap(start1, end1, start2, end2) {
    return !(start1 >= end2 || end1 <= start2);
}
const getAllSchedules = async (req, res, next) => {
    try {
        const { routeId, busId, driverId, status } = req.query;
        const whereClause = {};
        if (routeId)
            whereClause.routeId = parseInt(routeId, 10);
        if (busId)
            whereClause.busId = parseInt(busId, 10);
        if (driverId)
            whereClause.driverId = parseInt(driverId, 10);
        if (status)
            whereClause.status = status;
        const schedules = await prisma_1.default.schedule.findMany({
            where: whereClause,
            include: {
                route: true,
                bus: true,
                driver: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
            orderBy: { departureTime: 'asc' },
        });
        res.status(200).json({
            success: true,
            schedules,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllSchedules = getAllSchedules;
const getScheduleById = async (req, res, next) => {
    try {
        const scheduleId = parseInt(req.params.id, 10);
        if (isNaN(scheduleId)) {
            throw new error_1.ApiError(400, 'Invalid schedule identifier');
        }
        const schedule = await prisma_1.default.schedule.findUnique({
            where: { id: scheduleId },
            include: {
                route: true,
                bus: true,
                driver: {
                    include: { user: true },
                },
            },
        });
        if (!schedule) {
            throw new error_1.ApiError(404, 'Schedule not found');
        }
        res.status(200).json({
            success: true,
            schedule,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getScheduleById = getScheduleById;
const createSchedule = async (req, res, next) => {
    try {
        const { routeId, busId, driverId, departureTime, recurrence, status } = req.body;
        // 1. Fetch route details for duration calculation
        const route = await prisma_1.default.route.findUnique({ where: { id: routeId } });
        if (!route) {
            throw new error_1.ApiError(404, 'Selected transit route does not exist');
        }
        // 2. Compute arrival time string
        const startMins = timeToMinutes(departureTime);
        const endMins = (startMins + route.totalDuration) % 1440; // Clock loop boundary
        const arrivalHours = Math.floor(endMins / 60).toString().padStart(2, '0');
        const arrivalMins = (endMins % 60).toString().padStart(2, '0');
        const arrivalTime = `${arrivalHours}:${arrivalMins}`;
        // 3. Conflict Check for Bus
        const existingBusSchedules = await prisma_1.default.schedule.findMany({
            where: { busId, status: 'ACTIVE' },
            include: { route: true },
        });
        for (const es of existingBusSchedules) {
            const esStart = timeToMinutes(es.departureTime);
            const esEnd = timeToMinutes(es.arrivalTime);
            if (hasOverlap(startMins, endMins, esStart, esEnd)) {
                throw new error_1.ApiError(400, `Conflict: The selected bus is already assigned to Route '${es.route.name}' between ${es.departureTime} and ${es.arrivalTime}`);
            }
        }
        // 4. Conflict Check for Driver
        const existingDriverSchedules = await prisma_1.default.schedule.findMany({
            where: { driverId, status: 'ACTIVE' },
            include: { route: true },
        });
        for (const es of existingDriverSchedules) {
            const esStart = timeToMinutes(es.departureTime);
            const esEnd = timeToMinutes(es.arrivalTime);
            if (hasOverlap(startMins, endMins, esStart, esEnd)) {
                throw new error_1.ApiError(400, `Conflict: The assigned driver is already working on Route '${es.route.name}' between ${es.departureTime} and ${es.arrivalTime}`);
            }
        }
        // 5. Create Schedule
        const schedule = await prisma_1.default.schedule.create({
            data: {
                routeId,
                busId,
                driverId,
                departureTime,
                arrivalTime,
                recurrence: recurrence || 'DAILY',
                status: status || 'ACTIVE',
            },
        });
        // Audit Log
        await prisma_1.default.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'CREATE_SCHEDULE',
                details: `Assigned Bus ID ${busId} and Driver ID ${driverId} to Route ID ${routeId} departing at ${departureTime}`,
            },
        });
        res.status(201).json({
            success: true,
            schedule,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createSchedule = createSchedule;
const updateSchedule = async (req, res, next) => {
    try {
        const scheduleId = parseInt(req.params.id, 10);
        const { routeId, busId, driverId, departureTime, recurrence, status } = req.body;
        if (isNaN(scheduleId)) {
            throw new error_1.ApiError(400, 'Invalid schedule identifier');
        }
        const scheduleRecord = await prisma_1.default.schedule.findUnique({
            where: { id: scheduleId },
            include: { route: true },
        });
        if (!scheduleRecord) {
            throw new error_1.ApiError(404, 'Schedule not found');
        }
        const activeRouteId = routeId || scheduleRecord.routeId;
        const activeBusId = busId || scheduleRecord.busId;
        const activeDriverId = driverId || scheduleRecord.driverId;
        const activeDepTime = departureTime || scheduleRecord.departureTime;
        const route = await prisma_1.default.route.findUnique({ where: { id: activeRouteId } });
        if (!route) {
            throw new error_1.ApiError(404, 'Transit route does not exist');
        }
        const startMins = timeToMinutes(activeDepTime);
        const endMins = (startMins + route.totalDuration) % 1440;
        const arrivalHours = Math.floor(endMins / 60).toString().padStart(2, '0');
        const arrivalMins = (endMins % 60).toString().padStart(2, '0');
        const arrivalTime = `${arrivalHours}:${arrivalMins}`;
        // Conflict Check (excluding current schedule being edited)
        if (status !== 'INACTIVE') {
            const busConflicts = await prisma_1.default.schedule.findMany({
                where: { busId: activeBusId, status: 'ACTIVE', NOT: { id: scheduleId } },
                include: { route: true },
            });
            for (const es of busConflicts) {
                const esStart = timeToMinutes(es.departureTime);
                const esEnd = timeToMinutes(es.arrivalTime);
                if (hasOverlap(startMins, endMins, esStart, esEnd)) {
                    throw new error_1.ApiError(400, `Conflict: The bus is busy on Route '${es.route.name}' from ${es.departureTime} to ${es.arrivalTime}`);
                }
            }
            const driverConflicts = await prisma_1.default.schedule.findMany({
                where: { driverId: activeDriverId, status: 'ACTIVE', NOT: { id: scheduleId } },
                include: { route: true },
            });
            for (const es of driverConflicts) {
                const esStart = timeToMinutes(es.departureTime);
                const esEnd = timeToMinutes(es.arrivalTime);
                if (hasOverlap(startMins, endMins, esStart, esEnd)) {
                    throw new error_1.ApiError(400, `Conflict: The driver is busy on Route '${es.route.name}' from ${es.departureTime} to ${es.arrivalTime}`);
                }
            }
        }
        const updated = await prisma_1.default.schedule.update({
            where: { id: scheduleId },
            data: {
                routeId: activeRouteId,
                busId: activeBusId,
                driverId: activeDriverId,
                departureTime: activeDepTime,
                arrivalTime,
                recurrence,
                status,
            },
        });
        res.status(200).json({
            success: true,
            schedule: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateSchedule = updateSchedule;
const deleteSchedule = async (req, res, next) => {
    try {
        const scheduleId = parseInt(req.params.id, 10);
        if (isNaN(scheduleId)) {
            throw new error_1.ApiError(400, 'Invalid schedule identifier');
        }
        await prisma_1.default.schedule.delete({
            where: { id: scheduleId },
        });
        res.status(200).json({
            success: true,
            message: 'Schedule deleted successfully',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteSchedule = deleteSchedule;
// AI optimization schedule recommendation endpoint (Mocked pending ML model integration)
const getAIScheduleRecommendation = async (req, res, next) => {
    try {
        const { routeId } = req.query;
        if (!routeId) {
            throw new error_1.ApiError(400, 'Specify routeId to generate suggestions');
        }
        const route = await prisma_1.default.route.findUnique({
            where: { id: parseInt(routeId, 10) },
        });
        if (!route) {
            throw new error_1.ApiError(404, 'Route not found');
        }
        // Mock recommendations based on typical peak hours
        const suggestions = [
            {
                suggestedDeparture: '07:30',
                confidenceScore: 0.94,
                rationale: 'High morning passenger load predicted based on historic student rosters.',
            },
            {
                suggestedDeparture: '17:15',
                confidenceScore: 0.89,
                rationale: 'Evening peak traffic return hours matching institutional closing bell.',
            },
        ];
        res.status(200).json({
            success: true,
            routeId: route.id,
            routeName: route.name,
            suggestions,
            source: 'Mock AI Recommendation Engine',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAIScheduleRecommendation = getAIScheduleRecommendation;
