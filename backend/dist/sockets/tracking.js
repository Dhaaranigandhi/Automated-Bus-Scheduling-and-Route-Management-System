"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLocationTracking = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const prisma_1 = __importDefault(require("../config/prisma"));
const setupLocationTracking = (io) => {
    io.on('connection', (socket) => {
        logger_1.default.info(`Socket connected: ${socket.id}`);
        // Join a specific Trip room for live location listening
        socket.on('joinTrip', (tripId) => {
            socket.join(`trip:${tripId}`);
            logger_1.default.info(`Socket ${socket.id} joined trip:${tripId}`);
        });
        // Handle coordinate telemetry logs from drivers
        socket.on('updateLocation', async (data) => {
            const { tripId, latitude, longitude, speed } = data;
            logger_1.default.debug(`Live GPS Update - Trip ${tripId}: Lat ${latitude}, Lng ${longitude}, Speed ${speed} km/h`);
            // 1. Broadcast coordinate payload immediately to room (passengers tracking this trip)
            io.to(`trip:${tripId}`).emit('locationBroadcast', {
                tripId,
                latitude,
                longitude,
                speed,
                timestamp: new Date(),
            });
            // 2. Perform background checks
            try {
                // Log coordinates in DB (Throttle this in production, but here write it for accuracy)
                await prisma_1.default.gPSLocation.create({
                    data: {
                        tripId,
                        latitude,
                        longitude,
                        speed,
                    },
                });
                // Speed limit check (Get limit from settings or defaults to 70 km/h)
                const speedLimitSetting = await prisma_1.default.setting.findUnique({ where: { key: 'max_speed_limit' } });
                const speedLimit = speedLimitSetting ? parseFloat(speedLimitSetting.value) : 70;
                if (speed > speedLimit) {
                    logger_1.default.warn(`Speed Violation detected! Trip ${tripId} is running at ${speed} km/h (Limit: ${speedLimit} km/h)`);
                    // Emit real-time alert payload
                    io.to(`trip:${tripId}`).emit('speedAlert', {
                        tripId,
                        speed,
                        message: `Emergency: Bus is exceeding speed limits at ${speed} km/h!`,
                    });
                }
            }
            catch (err) {
                logger_1.default.error('Error handling location update trace', err);
            }
        });
        socket.on('disconnect', () => {
            logger_1.default.info(`Socket disconnected: ${socket.id}`);
        });
    });
};
exports.setupLocationTracking = setupLocationTracking;
