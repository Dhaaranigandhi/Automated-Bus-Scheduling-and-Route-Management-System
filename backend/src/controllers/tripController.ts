import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod schemas
export const gpsLogSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().min(0),
  }),
});

export const startTrip = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { scheduleId } = req.body;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true },
    });

    if (!schedule) {
      throw new ApiError(404, 'Schedule not found');
    }

    // Spawn Trip instance for today
    const trip = await prisma.trip.create({
      data: {
        scheduleId,
        date: new Date(),
        status: 'RUNNING',
        actualDeparture: new Date(),
      },
    });

    // Mark driver status as busy
    await prisma.driver.updateMany({
      where: { id: schedule.driverId },
      data: { availabilityStatus: 'ON_DUTY' },
    });

    // Mark bus status as running
    await prisma.bus.updateMany({
      where: { id: schedule.busId },
      data: { status: 'RUNNING' },
    });

    res.status(201).json({
      success: true,
      trip,
    });
  } catch (err) {
    next(err);
  }
};

export const endTrip = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) {
      throw new ApiError(400, 'Invalid trip identifier');
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        schedule: true,
      },
    });

    if (!trip) {
      throw new ApiError(404, 'Active trip instance not found');
    }

    const endedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        actualArrival: new Date(),
      },
    });

    // Reset status parameters
    await prisma.driver.updateMany({
      where: { id: trip.schedule.driverId },
      data: { availabilityStatus: 'AVAILABLE' },
    });

    await prisma.bus.updateMany({
      where: { id: trip.schedule.busId },
      data: { status: 'AVAILABLE' },
    });

    res.status(200).json({
      success: true,
      trip: endedTrip,
    });
  } catch (err) {
    next(err);
  }
};

export const logGPSLocation = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { latitude, longitude, speed } = req.body;

    if (isNaN(tripId)) {
      throw new ApiError(400, 'Invalid trip identifier');
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.status !== 'RUNNING') {
      throw new ApiError(400, 'GPS coordinates can only be logged for running trips');
    }

    const location = await prisma.gPSLocation.create({
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
  } catch (err) {
    next(err);
  }
};

export const getTripPlayback = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) {
      throw new ApiError(400, 'Invalid trip identifier');
    }

    const locations = await prisma.gPSLocation.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
    });

    res.status(200).json({
      success: true,
      locations,
    });
  } catch (err) {
    next(err);
  }
};

export const getLiveTrips = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const liveTrips = await prisma.trip.findMany({
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
  } catch (err) {
    next(err);
  }
};
