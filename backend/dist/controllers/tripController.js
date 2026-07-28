"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiveTrips = exports.getTripPlayback = exports.logGPSLocation = exports.endTrip = exports.startTrip = exports.gpsLogSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Zod schemas
exports.gpsLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
        speed: zod_1.z.number().min(0),
    }),
});
const startTrip = async (req, res, next) => {
    try {
        const { scheduleId } = req.body;
        const schedule = await prisma_1.default.schedule.findUnique({
            where: { id: scheduleId },
            include: { route: true },
        });
        if (!schedule) {
            throw new error_1.ApiError(404, 'Schedule not found');
        }
        // Spawn Trip instance for today
        const trip = await prisma_1.default.trip.create({
            data: {
                scheduleId,
                date: new Date(),
                status: 'RUNNING',
                actualDeparture: new Date(),
            },
        });
        // Mark driver status as busy
        await prisma_1.default.driver.updateMany({
            where: { id: schedule.driverId },
            data: { availabilityStatus: 'ON_DUTY' },
        });
        // Mark bus status as running
        await prisma_1.default.bus.updateMany({
            where: { id: schedule.busId },
            data: { status: 'RUNNING' },
        });
        res.status(201).json({
            success: true,
            trip,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.startTrip = startTrip;
const endTrip = async (req, res, next) => {
    try {
        const tripId = parseInt(req.params.id, 10);
        if (isNaN(tripId)) {
            throw new error_1.ApiError(400, 'Invalid trip identifier');
        }
        const trip = await prisma_1.default.trip.findUnique({
            where: { id: tripId },
            include: {
                schedule: true,
            },
        });
        if (!trip) {
            throw new error_1.ApiError(404, 'Active trip instance not found');
        }
        const endedTrip = await prisma_1.default.trip.update({
            where: { id: tripId },
            data: {
                status: 'COMPLETED',
                actualArrival: new Date(),
            },
        });
        // Reset status parameters
        await prisma_1.default.driver.updateMany({
            where: { id: trip.schedule.driverId },
            data: { availabilityStatus: 'AVAILABLE' },
        });
        await prisma_1.default.bus.updateMany({
            where: { id: trip.schedule.busId },
            data: { status: 'AVAILABLE' },
        });
        res.status(200).json({
            success: true,
            trip: endedTrip,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.endTrip = endTrip;
const logGPSLocation = async (req, res, next) => {
    try {
        const tripId = parseInt(req.params.id, 10);
        const { latitude, longitude, speed } = req.body;
        if (isNaN(tripId)) {
            throw new error_1.ApiError(400, 'Invalid trip identifier');
        }
        const trip = await prisma_1.default.trip.findUnique({ where: { id: tripId } });
        if (!trip || trip.status !== 'RUNNING') {
            throw new error_1.ApiError(400, 'GPS coordinates can only be logged for running trips');
        }
        const location = await prisma_1.default.gPSLocation.create({
            data: {
                tripId,
                latitude,
                longitude,
                speed,
                timestamp: new Date(),
            },
        });
        res.status(201).json({
            success: true,
            location,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.logGPSLocation = logGPSLocation;
const getTripPlayback = async (req, res, next) => {
    try {
        const tripId = parseInt(req.params.id, 10);
        if (isNaN(tripId)) {
            throw new error_1.ApiError(400, 'Invalid trip identifier');
        }
        const locations = await prisma_1.default.gPSLocation.findMany({
            where: { tripId },
            orderBy: { timestamp: 'asc' },
        });
        res.status(200).json({
            success: true,
            locations,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getTripPlayback = getTripPlayback;
const getLiveTrips = async (req, res, next) => {
    try {
        const liveTrips = await prisma_1.default.trip.findMany({
            where: { status: 'RUNNING' },
            include: {
                schedule: {
                    include: {
                        route: true,
                        bus: true,
                        driver: { include: { user: { select: { name: true } } } },
                    },
                },
                gpsLocations: {
                    orderBy: { timestamp: 'desc' },
                    take: 1, // Only grab latest coordinate for map placement
                },
            },
        });
        res.status(200).json({
            success: true,
            trips: liveTrips,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getLiveTrips = getLiveTrips;
