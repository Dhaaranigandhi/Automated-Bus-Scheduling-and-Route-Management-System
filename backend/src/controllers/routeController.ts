import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Swappable Routing Provider Interface
interface RoutingProvider {
  calculateMatrix(
    stops: { lat: number; lng: number }[]
  ): Promise<{ distanceKm: number; durationMins: number }>;
}

// Fallback provider using Haversine formula to compute distance mathematically
class HaversineRoutingProvider implements RoutingProvider {
  async calculateMatrix(
    stops: { lat: number; lng: number }[]
  ): Promise<{ distanceKm: number; durationMins: number }> {
    if (stops.length < 2) return { distanceKm: 0, durationMins: 0 };

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

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// In a real production deployment, this would load Google Maps Distance Matrix / Geoapify
const activeRoutingProvider: RoutingProvider = new HaversineRoutingProvider();

// Zod schemas
export const routeCreateSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Route name must be descriptive'),
    startLocation: z.string().min(2, 'Start location required'),
    endLocation: z.string().min(2, 'End location required'),
    stops: z.array(
      z.object({
        stopName: z.string().min(2, 'Stop name must be valid'),
        stopOrder: z.number().int().min(1),
        latitude: z.number(),
        longitude: z.number(),
        etaOffset: z.number().int().optional(),
      })
    ).min(2, 'A route must contain at least 2 stops (Source & Destination)'),
  }),
});

export const getAllRoutes = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { search } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { startLocation: { contains: search as string, mode: 'insensitive' } },
        { endLocation: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const routes = await prisma.route.findMany({
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
  } catch (err) {
    next(err);
  }
};

export const getRouteById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const routeId = parseInt(req.params.id, 10);
    if (isNaN(routeId)) {
      throw new ApiError(400, 'Invalid route identifier');
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        stops: { orderBy: { stopOrder: 'asc' } },
        schedules: {
          include: { bus: true, driver: { include: { user: true } } },
        },
      },
    });

    if (!route) {
      throw new ApiError(404, 'Transit route not found');
    }

    res.status(200).json({
      success: true,
      route,
    });
  } catch (err) {
    next(err);
  }
};

export const createRoute = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { name, startLocation, endLocation, stops } = req.body;

    // Sort stops to ensure correct ordering
    const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);

    // Calculate matrix details via routing provider (Haversine math)
    const coordinates = sortedStops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
    const matrix = await activeRoutingProvider.calculateMatrix(coordinates);

    const route = await prisma.$transaction(async (tx) => {
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
  } catch (err) {
    next(err);
  }
};

export const updateRoute = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const routeId = parseInt(req.params.id, 10);
    const { name, startLocation, endLocation, stops } = req.body;

    if (isNaN(routeId)) {
      throw new ApiError(400, 'Invalid route identifier');
    }

    const routeRecord = await prisma.route.findUnique({ where: { id: routeId } });
    if (!routeRecord) {
      throw new ApiError(404, 'Transit route not found');
    }

    const updatedRoute = await prisma.$transaction(async (tx) => {
      let distance = routeRecord.totalDistance;
      let duration = routeRecord.totalDuration;

      // If stops change, recalculate route distance metrics
      if (stops && stops.length >= 2) {
        const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
        const coordinates = sortedStops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
        const matrix = await activeRoutingProvider.calculateMatrix(coordinates);
        distance = matrix.distanceKm as any;
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
  } catch (err) {
    next(err);
  }
};

export const deleteRoute = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const routeId = parseInt(req.params.id, 10);
    if (isNaN(routeId)) {
      throw new ApiError(400, 'Invalid route identifier');
    }

    const routeRecord = await prisma.route.findUnique({ where: { id: routeId } });
    if (!routeRecord) {
      throw new ApiError(404, 'Transit route not found');
    }

    const activeSchedule = await prisma.schedule.findFirst({
      where: { routeId, status: 'ACTIVE' },
    });
    if (activeSchedule) {
      throw new ApiError(400, 'Cannot delete route assigned to active schedules');
    }

    await prisma.route.delete({
      where: { id: routeId },
    });

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
