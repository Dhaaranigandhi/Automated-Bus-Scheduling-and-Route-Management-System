"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpsSimulator = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
class GPSTelemetrySimulator {
    constructor() {
        this.activeSimulations = new Map();
        this.intervalTimer = null;
        this.ioServer = null;
    }
    startSimulation(io) {
        this.ioServer = io;
        logger_1.default.info('GPS Telemetry Simulator initialized.');
        // Run simulation loop every 4 seconds
        if (!this.intervalTimer) {
            this.intervalTimer = setInterval(() => this.tick(), 4000);
        }
    }
    stopSimulation() {
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
            logger_1.default.info('GPS Telemetry Simulator stopped.');
        }
    }
    async tick() {
        if (!this.ioServer)
            return;
        try {
            // 1. Fetch active or scheduled trips that need tracking
            const activeTrips = await prisma_1.default.trip.findMany({
                where: {
                    status: { in: ['RUNNING', 'SCHEDULED'] },
                },
                include: {
                    schedule: {
                        include: {
                            route: {
                                include: {
                                    stops: { orderBy: { stopOrder: 'asc' } },
                                },
                            },
                            bus: true,
                            driver: { include: { user: true } },
                        },
                    },
                },
                take: 5,
            });
            if (activeTrips.length === 0)
                return;
            for (const trip of activeTrips) {
                const stops = trip.schedule.route.stops;
                if (stops.length < 2)
                    continue;
                let state = this.activeSimulations.get(trip.id);
                if (!state) {
                    state = {
                        tripId: trip.id,
                        routeStops: stops.map((s) => ({
                            latitude: Number(s.latitude),
                            longitude: Number(s.longitude),
                            stopName: s.stopName,
                        })),
                        currentIndex: 0,
                        progressPercentage: 0,
                        currentSpeed: 42 + Math.floor(Math.random() * 15), // Simulated speed (42 - 57 km/h)
                    };
                    this.activeSimulations.set(trip.id, state);
                }
                // Advance to next waypoint
                state.currentIndex = (state.currentIndex + 1) % state.routeStops.length;
                const currentWaypoint = state.routeStops[state.currentIndex];
                // Randomize speed slightly around speed limits
                state.currentSpeed = Math.min(85, Math.max(25, state.currentSpeed + (Math.random() * 10 - 5)));
                state.progressPercentage = Math.round((state.currentIndex / (state.routeStops.length - 1)) * 100);
                // Store location update in database
                const savedLocation = await prisma_1.default.gPSLocation.create({
                    data: {
                        tripId: trip.id,
                        latitude: currentWaypoint.latitude,
                        longitude: currentWaypoint.longitude,
                        speed: parseFloat(state.currentSpeed.toFixed(1)),
                    },
                });
                // Broadcast to Socket.IO subscribers
                const payload = {
                    tripId: trip.id,
                    busNumber: trip.schedule.bus.registrationNumber,
                    driverName: trip.schedule.driver.user?.name || 'Assigned Driver',
                    routeName: trip.schedule.route.name,
                    latitude: currentWaypoint.latitude,
                    longitude: currentWaypoint.longitude,
                    speed: parseFloat(state.currentSpeed.toFixed(1)),
                    currentStop: currentWaypoint.stopName,
                    progressPercentage: state.progressPercentage,
                    timestamp: savedLocation.timestamp,
                };
                this.ioServer.to(`trip:${trip.id}`).emit('locationBroadcast', payload);
                this.ioServer.emit('globalFleetUpdate', payload);
                // Check for simulated speed alerts (e.g. if speed > 70 km/h)
                if (state.currentSpeed > 70) {
                    this.ioServer.to(`trip:${trip.id}`).emit('speedAlert', {
                        tripId: trip.id,
                        busNumber: trip.schedule.bus.registrationNumber,
                        speed: parseFloat(state.currentSpeed.toFixed(1)),
                        message: `Speed Warning: Bus ${trip.schedule.bus.registrationNumber} recorded at ${state.currentSpeed.toFixed(1)} km/h!`,
                    });
                }
            }
        }
        catch (err) {
            logger_1.default.error('Error during GPS simulation tick', err);
        }
    }
}
exports.gpsSimulator = new GPSTelemetrySimulator();
