"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRoute = exports.updateRoute = exports.createRoute = exports.getRouteById = exports.getAllRoutes = exports.routeCreateSchema = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_1 = require("../middlewares/error");
// Fallback provider using Haversine formula to compute distance mathematically
class HaversineRoutingProvider {
    async calculateMatrix(stops) {
        if (stops.length < 2)
            return { distanceKm: 0, durationMins: 0 };
        let totalDist = 0;
        for (let i = 0; i < stops.length - 1; i++) {
            const p1 = stops[i];
            const p2 = stops[i + 1];
            totalDist += this.haversine(p1.lat, p1.lng, p2.lat, p2.lng);
        }
        // Assume average transit speed of 30 km/h inside municipal bounds
        const duration = Math.round((totalDist / 30) * 60);
        return {
            distanceKm: parseFloat(totalDist.toFixed(2)),
            durationMins: Math.max(duration, 5), // Minimum 5 mins
        };
    }
    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
// In a real production deployment, this would load Google Maps Distance Matrix / Geoapify
const activeRoutingProvider = new HaversineRoutingProvider();
// Zod schemas
exports.routeCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(3, 'Route name must be descriptive'),
        startLocation: zod_1.z.string().min(2, 'Start location required'),
        endLocation: zod_1.z.string().min(2, 'End location required'),
        stops: zod_1.z.array(zod_1.z.object({
            stopName: zod_1.z.string().min(2, 'Stop name must be valid'),
            stopOrder: zod_1.z.number().int().min(1),
            latitude: zod_1.z.number(),
            longitude: zod_1.z.number(),
            etaOffset: zod_1.z.number().int().optional(),
        })).min(2, 'A route must contain at least 2 stops (Source & Destination)'),
    }),
});
const getAllRoutes = async (req, res, next) => {
    try {
        const { search } = req.query;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { startLocation: { contains: search, mode: 'insensitive' } },
                { endLocation: { contains: search, mode: 'insensitive' } },
            ];
        }
        const routes = await prisma_1.default.route.findMany({
            where: whereClause,
            include: {
                stops: { orderBy: { stopOrder: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            routes,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllRoutes = getAllRoutes;
const getRouteById = async (req, res, next) => {
    try {
        const routeId = parseInt(req.params.id, 10);
        if (isNaN(routeId)) {
            throw new error_1.ApiError(400, 'Invalid route identifier');
        }
        const route = await prisma_1.default.route.findUnique({
            where: { id: routeId },
            include: {
                stops: { orderBy: { stopOrder: 'asc' } },
                schedules: {
                    include: { bus: true, driver: { include: { user: true } } },
                },
            },
        });
        if (!route) {
            throw new error_1.ApiError(404, 'Transit route not found');
        }
        res.status(200).json({
            success: true,
            route,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getRouteById = getRouteById;
const createRoute = async (req, res, next) => {
    try {
        const { name, startLocation, endLocation, stops } = req.body;
        // Sort stops to ensure correct ordering
        const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
        // Calculate matrix details via routing provider (Haversine math)
        const coordinates = sortedStops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
        const matrix = await activeRoutingProvider.calculateMatrix(coordinates);
        const route = await prisma_1.default.$transaction(async (tx) => {
            const createdRoute = await tx.route.create({
                data: {
                    name,
                    startLocation,
                    endLocation,
                    totalDistance: matrix.distanceKm,
                    totalDuration: matrix.durationMins,
                },
            });
            // Save Stops
            for (const s of sortedStops) {
                await tx.routeStop.create({
                    data: {
                        routeId: createdRoute.id,
                        stopName: s.stopName,
                        stopOrder: s.stopOrder,
                        latitude: s.latitude,
                        longitude: s.longitude,
                        etaOffset: s.etaOffset !== undefined ? s.etaOffset : 0,
                    },
                });
            }
            return createdRoute;
        });
        res.status(201).json({
            success: true,
            route,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.createRoute = createRoute;
const updateRoute = async (req, res, next) => {
    try {
        const routeId = parseInt(req.params.id, 10);
        const { name, startLocation, endLocation, stops } = req.body;
        if (isNaN(routeId)) {
            throw new error_1.ApiError(400, 'Invalid route identifier');
        }
        const routeRecord = await prisma_1.default.route.findUnique({ where: { id: routeId } });
        if (!routeRecord) {
            throw new error_1.ApiError(404, 'Transit route not found');
        }
        const updatedRoute = await prisma_1.default.$transaction(async (tx) => {
            let distance = routeRecord.totalDistance;
            let duration = routeRecord.totalDuration;
            // If stops change, recalculate route distance metrics
            if (stops && stops.length >= 2) {
                const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
                const coordinates = sortedStops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
                const matrix = await activeRoutingProvider.calculateMatrix(coordinates);
                distance = matrix.distanceKm;
                duration = matrix.durationMins;
                // Clear existing stops
                await tx.routeStop.deleteMany({ where: { routeId } });
                // Save new stops
                for (const s of sortedStops) {
                    await tx.routeStop.create({
                        data: {
                            routeId,
                            stopName: s.stopName,
                            stopOrder: s.stopOrder,
                            latitude: s.latitude,
                            longitude: s.longitude,
                            etaOffset: s.etaOffset !== undefined ? s.etaOffset : 0,
                        },
                    });
                }
            }
            return await tx.route.update({
                where: { id: routeId },
                data: {
                    name,
                    startLocation,
                    endLocation,
                    totalDistance: distance,
                    totalDuration: duration,
                },
            });
        });
        res.status(200).json({
            success: true,
            route: updatedRoute,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.updateRoute = updateRoute;
const deleteRoute = async (req, res, next) => {
    try {
        const routeId = parseInt(req.params.id, 10);
        if (isNaN(routeId)) {
            throw new error_1.ApiError(400, 'Invalid route identifier');
        }
        const routeRecord = await prisma_1.default.route.findUnique({ where: { id: routeId } });
        if (!routeRecord) {
            throw new error_1.ApiError(404, 'Transit route not found');
        }
        const activeSchedule = await prisma_1.default.schedule.findFirst({
            where: { routeId, status: 'ACTIVE' },
        });
        if (activeSchedule) {
            throw new error_1.ApiError(400, 'Cannot delete route assigned to active schedules');
        }
        await prisma_1.default.route.delete({
            where: { id: routeId },
        });
        res.status(200).json({
            success: true,
            message: 'Route deleted successfully',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteRoute = deleteRoute;
