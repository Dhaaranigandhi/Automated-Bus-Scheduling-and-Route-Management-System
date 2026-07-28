import { Server, Socket } from 'socket.io';
import logger from '../config/logger';
import prisma from '../config/prisma';

export const setupLocationTracking = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a specific Trip room for live location listening
    socket.on('joinTrip', (tripId: number) => {
      socket.join(`trip:${tripId}`);
      logger.info(`Socket ${socket.id} joined trip:${tripId}`);
    });

    // Handle coordinate telemetry logs from drivers
    socket.on('updateLocation', async (data: {
      tripId: number;
      latitude: number;
      longitude: number;
      speed: number;
    }) => {
      const { tripId, latitude, longitude, speed } = data;

      logger.debug(`Live GPS Update - Trip ${tripId}: Lat ${latitude}, Lng ${longitude}, Speed ${speed} km/h`);

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
        await prisma.gPSLocation.create({
          data: {
            tripId,
            latitude,
            longitude,
            speed,
          },
        });

        // Speed limit check (Get limit from settings or defaults to 70 km/h)
        const speedLimitSetting = await prisma.setting.findUnique({ where: { key: 'max_speed_limit' } });
        const speedLimit = speedLimitSetting ? parseFloat(speedLimitSetting.value) : 70;

        if (speed > speedLimit) {
          logger.warn(`Speed Violation detected! Trip ${tripId} is running at ${speed} km/h (Limit: ${speedLimit} km/h)`);
          
          // Emit real-time alert payload
          io.to(`trip:${tripId}`).emit('speedAlert', {
            tripId,
            speed,
            message: `Emergency: Bus is exceeding speed limits at ${speed} km/h!`,
          });
        }
      } catch (err) {
        logger.error('Error handling location update trace', err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
