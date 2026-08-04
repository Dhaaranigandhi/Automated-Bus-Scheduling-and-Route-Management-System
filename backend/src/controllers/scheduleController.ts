import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod Validation schemas
export const scheduleCreateSchema = z.object({
  body: z.object({
    routeId: z.number().int(),
    busId: z.number().int(),
    driverId: z.number().int(),
    departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure must be in HH:MM format'),
    recurrence: z.enum(['DAILY', 'WEEKDAYS', 'WEEKENDS', 'HOLIDAYS']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

// Helper to convert time strings "HH:MM" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Overlap validation helper
function hasOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return !(start1 >= end2 || end1 <= start2);
}

export const getAllSchedules = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { routeId, busId, driverId, status } = req.query;

    const whereClause: any = {};
    if (routeId) whereClause.routeId = parseInt(routeId as string, 10);
    if (busId) whereClause.busId = parseInt(busId as string, 10);
    if (driverId) whereClause.driverId = parseInt(driverId as string, 10);
    if (status) whereClause.status = status as string;

    const schedules = await prisma.schedule.findMany({
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
  } catch (err) {
    next(err);
  }
};

export const getScheduleById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);
    if (isNaN(scheduleId)) {
      throw new ApiError(400, 'Invalid schedule identifier');
    }

    const schedule = await prisma.schedule.findUnique({
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
      throw new ApiError(404, 'Schedule not found');
    }

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (err) {
    next(err);
  }
};

export const createSchedule = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { routeId, busId, driverId, departureTime, recurrence, status } = req.body;

    // 1. Fetch route details for duration calculation
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      throw new ApiError(404, 'Selected transit route does not exist');
    }

    // 2. Compute arrival time string
    const startMins = timeToMinutes(departureTime);
    const endMins = (startMins + route.totalDuration) % 1440; // Clock loop boundary
    const arrivalHours = Math.floor(endMins / 60).toString().padStart(2, '0');
    const arrivalMins = (endMins % 60).toString().padStart(2, '0');
    const arrivalTime = `${arrivalHours}:${arrivalMins}`;

    // 3. Conflict Check for Bus
    const existingBusSchedules = await prisma.schedule.findMany({
      where: { busId, status: 'ACTIVE' },
      include: { route: true },
    });

    for (const es of existingBusSchedules) {
      const esStart = timeToMinutes(es.departureTime);
      const esEnd = timeToMinutes(es.arrivalTime);
      if (hasOverlap(startMins, endMins, esStart, esEnd)) {
        throw new ApiError(
          400,
          `Conflict: The selected bus is already assigned to Route '${es.route.name}' between ${es.departureTime} and ${es.arrivalTime}`
        );
      }
    }

    // 4. Conflict Check for Driver
    const existingDriverSchedules = await prisma.schedule.findMany({
      where: { driverId, status: 'ACTIVE' },
      include: { route: true },
    });

    for (const es of existingDriverSchedules) {
      const esStart = timeToMinutes(es.departureTime);
      const esEnd = timeToMinutes(es.arrivalTime);
      if (hasOverlap(startMins, endMins, esStart, esEnd)) {
        throw new ApiError(
          400,
          `Conflict: The assigned driver is already working on Route '${es.route.name}' between ${es.departureTime} and ${es.arrivalTime}`
        );
      }
    }

    // 5. Create Schedule
    const schedule = await prisma.schedule.create({
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
    await prisma.auditLog.create({
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
  } catch (err) {
    next(err);
  }
};

export const updateSchedule = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);
    const { routeId, busId, driverId, departureTime, recurrence, status } = req.body;

    if (isNaN(scheduleId)) {
      throw new ApiError(400, 'Invalid schedule identifier');
    }

    const scheduleRecord = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true },
    });

    if (!scheduleRecord) {
      throw new ApiError(404, 'Schedule not found');
    }

    const activeRouteId = routeId || scheduleRecord.routeId;
    const activeBusId = busId || scheduleRecord.busId;
    const activeDriverId = driverId || scheduleRecord.driverId;
    const activeDepTime = departureTime || scheduleRecord.departureTime;

    const route = await prisma.route.findUnique({ where: { id: activeRouteId } });
    if (!route) {
      throw new ApiError(404, 'Transit route does not exist');
    }

    const startMins = timeToMinutes(activeDepTime);
    const endMins = (startMins + route.totalDuration) % 1440;
    const arrivalHours = Math.floor(endMins / 60).toString().padStart(2, '0');
    const arrivalMins = (endMins % 60).toString().padStart(2, '0');
    const arrivalTime = `${arrivalHours}:${arrivalMins}`;

    // Conflict Check (excluding current schedule being edited)
    if (status !== 'INACTIVE') {
      const busConflicts = await prisma.schedule.findMany({
        where: { busId: activeBusId, status: 'ACTIVE', NOT: { id: scheduleId } },
        include: { route: true },
      });
      for (const es of busConflicts) {
        const esStart = timeToMinutes(es.departureTime);
        const esEnd = timeToMinutes(es.arrivalTime);
        if (hasOverlap(startMins, endMins, esStart, esEnd)) {
          throw new ApiError(
            400,
            `Conflict: The bus is busy on Route '${es.route.name}' from ${es.departureTime} to ${es.arrivalTime}`
          );
        }
      }

      const driverConflicts = await prisma.schedule.findMany({
        where: { driverId: activeDriverId, status: 'ACTIVE', NOT: { id: scheduleId } },
        include: { route: true },
      });
      for (const es of driverConflicts) {
        const esStart = timeToMinutes(es.departureTime);
        const esEnd = timeToMinutes(es.arrivalTime);
        if (hasOverlap(startMins, endMins, esStart, esEnd)) {
          throw new ApiError(
            400,
            `Conflict: The driver is busy on Route '${es.route.name}' from ${es.departureTime} to ${es.arrivalTime}`
          );
        }
      }
    }

    const updated = await prisma.schedule.update({
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
  } catch (err) {
    next(err);
  }
};

export const deleteSchedule = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);
    if (isNaN(scheduleId)) {
      throw new ApiError(400, 'Invalid schedule identifier');
    }

    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// AI optimization schedule recommendation endpoint (Mocked pending ML model integration)
export const getAIScheduleRecommendation = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { routeId } = req.query;

    if (!routeId) {
      throw new ApiError(400, 'Specify routeId to generate suggestions');
    }

    const route = await prisma.route.findUnique({
      where: { id: parseInt(routeId as string, 10) },
    });

    if (!route) {
      throw new ApiError(404, 'Route not found');
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
  } catch (err) {
    next(err);
  }
};

// Batch conflict validation helper
async function runBatchValidation(
  proposed: any[],
  existing: any[],
  buses: any[],
  drivers: any[],
  routes: any[],
  maintenances: any[]
) {
  const conflicts: any[] = [];
  const maintenanceBusIds = new Set(maintenances.map(m => m.busId));

  for (let i = 0; i < proposed.length; i++) {
    const p = proposed[i];
    const bus = buses.find(b => b.id === p.busId);
    const driver = drivers.find(d => d.id === p.driverId);
    const route = routes.find(r => r.id === p.routeId);

    if (!p.departureTime || !p.arrivalTime) continue;

    const pStart = timeToMinutes(p.departureTime);
    const pEnd = timeToMinutes(p.arrivalTime);

    // 1. Inactive route
    if (!route) {
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Route Conflict',
        conflict: `Route ID ${p.routeId} not found`,
        reason: `The route ID assigned is inactive or does not exist.`,
        suggestedResolution: `Assign a valid active route corridor.`
      });
      continue;
    }

    // 2. Bus under maintenance
    const isBusInMaintDb = maintenanceBusIds.has(p.busId) || (bus && bus.status === 'MAINTENANCE');
    if (isBusInMaintDb) {
      const altBus = buses.find(b => 
        b.id !== p.busId && 
        b.status !== 'INACTIVE' && 
        b.status !== 'MAINTENANCE' && 
        !maintenanceBusIds.has(b.id) &&
        !existing.some(s => s.busId === b.id && hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))) &&
        !proposed.some((pr, idx) => idx !== i && pr.busId === b.id && hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime)))
      );
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Maintenance Conflict',
        conflict: `Bus ${bus ? bus.registrationNumber : p.busId} is under maintenance`,
        reason: `Vehicle status is set to MAINTENANCE or it has active maintenance scheduled.`,
        suggestedResolution: altBus 
          ? `Assign alternative Bus ${altBus.registrationNumber} instead.` 
          : `De-allocate slot or wait for maintenance to conclude.`
      });
    }

    // 3. Inactive bus
    if (bus && bus.status === 'INACTIVE') {
      const altBus = buses.find(b => 
        b.id !== p.busId && 
        b.status !== 'INACTIVE' && 
        b.status !== 'MAINTENANCE' && 
        !maintenanceBusIds.has(b.id) &&
        !existing.some(s => s.busId === b.id && hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))) &&
        !proposed.some((pr, idx) => idx !== i && pr.busId === b.id && hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime)))
      );
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Bus Conflict',
        conflict: `Bus ${bus.registrationNumber} is inactive`,
        reason: `Vehicle status is set to INACTIVE.`,
        suggestedResolution: altBus 
          ? `Assign alternative Bus ${altBus.registrationNumber} instead.`
          : `Activate the vehicle or allocate another.`
      });
    }

    // 4. Inactive driver
    const isDriverInactive = driver && (driver.availabilityStatus === 'OFF_DUTY' || driver.availabilityStatus === 'SUSPENDED');
    if (isDriverInactive) {
      const altDriver = drivers.find(d => 
        d.id !== p.driverId && 
        d.availabilityStatus !== 'OFF_DUTY' && 
        d.availabilityStatus !== 'SUSPENDED' &&
        !existing.some(s => s.driverId === d.id && hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))) &&
        !proposed.some((pr, idx) => idx !== i && pr.driverId === d.id && hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime)))
      );
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Driver Conflict',
        conflict: `Driver ${driver && driver.user ? driver.user.name : p.driverId} is inactive`,
        reason: `Driver availability status is ${driver ? driver.availabilityStatus : 'INACTIVE'}.`,
        suggestedResolution: altDriver 
          ? `Assign alternative Driver ${altDriver.user ? altDriver.user.name : altDriver.licenseNumber} instead.` 
          : `Wait for driver shift or allocate another available driver.`
      });
    }

    // 5. Bus overlap conflict
    const otherPropBusOverlap = proposed.find((pr, idx) => 
      idx !== i && 
      pr.busId === p.busId && 
      hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime))
    );
    const dbBusOverlap = existing.find(s => 
      s.id !== p.id &&
      s.busId === p.busId && 
      hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))
    );

    if (otherPropBusOverlap || dbBusOverlap) {
      const overlapWith = otherPropBusOverlap || dbBusOverlap;
      const altBus = buses.find(b => 
        b.status !== 'INACTIVE' && 
        b.status !== 'MAINTENANCE' && 
        !maintenanceBusIds.has(b.id) &&
        !existing.some(s => s.busId === b.id && hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))) &&
        !proposed.some((pr, idx) => pr.busId === b.id && hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime)))
      );
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Bus Conflict',
        conflict: `Bus ${bus ? bus.registrationNumber : p.busId} is already allocated`,
        reason: `Bus is busy on Route '${overlapWith.route ? overlapWith.route.name : 'Another Route'}' between ${overlapWith.departureTime} and ${overlapWith.arrivalTime}.`,
        suggestedResolution: altBus 
          ? `Assign Bus ${altBus.registrationNumber} instead.`
          : `Change schedule timing to avoid overlap.`
      });
    }

    // 6. Driver overlap conflict
    const otherPropDriverOverlap = proposed.find((pr, idx) => 
      idx !== i && 
      pr.driverId === p.driverId && 
      hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime))
    );
    const dbDriverOverlap = existing.find(s => 
      s.id !== p.id &&
      s.driverId === p.driverId && 
      hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))
    );

    if (otherPropDriverOverlap || dbDriverOverlap) {
      const overlapWith = otherPropDriverOverlap || dbDriverOverlap;
      const altDriver = drivers.find(d => 
        d.availabilityStatus !== 'OFF_DUTY' && 
        d.availabilityStatus !== 'SUSPENDED' &&
        !existing.some(s => s.driverId === d.id && hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))) &&
        !proposed.some((pr, idx) => pr.driverId === d.id && hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime)))
      );
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Driver Conflict',
        conflict: `Driver ${driver && driver.user ? driver.user.name : p.driverId} is already assigned`,
        reason: `Driver is working on Route '${overlapWith.route ? overlapWith.route.name : 'Another Route'}' between ${overlapWith.departureTime} and ${overlapWith.arrivalTime}.`,
        suggestedResolution: altDriver 
          ? `Assign Driver ${altDriver.user ? altDriver.user.name : altDriver.licenseNumber} instead.`
          : `Reschedule driver shift timings.`
      });
    }

    // 7. Duplicate schedule check
    const isDuplicate = existing.some(s => s.id !== p.id && s.routeId === p.routeId && s.departureTime === p.departureTime) ||
                        proposed.some((pr, idx) => idx !== i && pr.routeId === p.routeId && pr.departureTime === p.departureTime);
    if (isDuplicate) {
      conflicts.push({
        scheduleId: p.id || `proposed-${i}`,
        type: 'Duplicate Schedule',
        conflict: `Duplicate schedule detected`,
        reason: `A schedule for Route '${route ? route.name : p.routeId}' at ${p.departureTime} already exists.`,
        suggestedResolution: `Remove or reschedule this timing run.`
      });
    }

    // 8. Driver Duty Validation
    if (driver && !isDriverInactive && !otherPropDriverOverlap && !dbDriverOverlap) {
      const driverSchedules = [
        ...existing.filter(s => s.driverId === p.driverId && s.id !== p.id),
        ...proposed.filter((pr, idx) => pr.driverId === p.driverId && idx <= i)
      ];

      const totalDuration = driverSchedules.reduce((sum, s) => {
        const routeObj = routes.find(r => r.id === s.routeId);
        return sum + (routeObj ? routeObj.totalDuration : 0);
      }, 0);

      const altDriver = drivers.find(d => 
        d.id !== p.driverId && 
        d.availabilityStatus !== 'OFF_DUTY' && 
        d.availabilityStatus !== 'SUSPENDED' &&
        !existing.some(s => s.driverId === d.id && hasOverlap(pStart, pEnd, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime))) &&
        !proposed.some((pr, idx) => pr.driverId === d.id && hasOverlap(pStart, pEnd, timeToMinutes(pr.departureTime), timeToMinutes(pr.arrivalTime)))
      );

      if (totalDuration > 480) {
        conflicts.push({
          scheduleId: p.id || `proposed-${i}`,
          type: 'Driver Duty Violation',
          conflict: `Driver exceeds maximum working hours limit (8 hours)`,
          reason: `Driver ${driver.user ? driver.user.name : driver.licenseNumber} total scheduled duty duration is ${Math.round(totalDuration / 60 * 10) / 10} hours.`,
          suggestedResolution: altDriver 
            ? `Assign Driver ${altDriver.user ? altDriver.user.name : altDriver.licenseNumber} instead.`
            : `Reduce number of routes assigned to this driver.`
        });
      }

      if (driverSchedules.length > 3) {
        conflicts.push({
          scheduleId: p.id || `proposed-${i}`,
          type: 'Driver Duty Violation',
          conflict: `Driver exceeds daily consecutive trip limits (max 3 trips)`,
          reason: `Driver ${driver.user ? driver.user.name : driver.licenseNumber} is assigned to ${driverSchedules.length} schedules today.`,
          suggestedResolution: altDriver 
            ? `Assign Driver ${altDriver.user ? altDriver.user.name : altDriver.licenseNumber} instead.`
            : `De-allocate a schedule to respect consecutive trip limits.`
        });
      }

      for (const s of driverSchedules) {
        if (s.departureTime === p.departureTime) continue;
        const sStart = timeToMinutes(s.departureTime);
        const sEnd = timeToMinutes(s.arrivalTime);
        
        if (sStart >= pEnd) {
          if (sStart - pEnd < 30) {
            conflicts.push({
              scheduleId: p.id || `proposed-${i}`,
              type: 'Driver Duty Violation',
              conflict: `Driver break time is less than 30 minutes`,
              reason: `Driver has only ${sStart - pEnd} minutes of break before starting Route ID ${s.routeId} at ${s.departureTime}.`,
              suggestedResolution: altDriver 
                ? `Assign Driver ${altDriver.user ? altDriver.user.name : altDriver.licenseNumber} instead.`
                : `Reschedule departure time to allow a 30-minute break.`
            });
            break;
          }
        }
        if (pStart >= sEnd) {
          if (pStart - sEnd < 30) {
            conflicts.push({
              scheduleId: p.id || `proposed-${i}`,
              type: 'Driver Duty Violation',
              conflict: `Driver break time is less than 30 minutes`,
              reason: `Driver has only ${pStart - sEnd} minutes of break since completing previous route ending at ${s.arrivalTime}.`,
              suggestedResolution: altDriver 
                ? `Assign Driver ${altDriver.user ? altDriver.user.name : altDriver.licenseNumber} instead.`
                : `Reschedule departure time to allow a 30-minute break.`
            });
            break;
          }
        }
      }
    }
  }

  return {
    conflicts,
    automaticallyResolvedCount: 0
  };
}

// 1. Auto Generate Schedules (POST)
export const autoGenerateSchedules = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const routes = await prisma.route.findMany({
      include: { stops: true }
    });
    const buses = await prisma.bus.findMany();
    const drivers = await prisma.driver.findMany({
      include: { user: true }
    });
    const maintenances = await prisma.maintenance.findMany({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }
    });
    const existingSchedules = await prisma.schedule.findMany({
      where: { status: 'ACTIVE' },
      include: {
        route: true,
        bus: true,
        driver: { include: { user: true } }
      }
    });

    const maintenanceBusIds = new Set(maintenances.map(m => m.busId));
    
    // Buses under maintenance/inactive
    const activeBuses = buses.filter(b => b.status !== 'INACTIVE' && b.status !== 'MAINTENANCE' && !maintenanceBusIds.has(b.id));
    const activeDrivers = drivers.filter(d => d.availabilityStatus === 'AVAILABLE' || d.availabilityStatus === 'ON_DUTY');

    // Priority Route Derivation (Step 4)
    // High: totalDistance > 20 km or totalDuration > 40 mins
    // Medium: totalDistance > 10 km or totalDuration > 20 mins
    // Low: rest
    const getPriority = (route: any) => {
      const dist = parseFloat(route.totalDistance.toString());
      const dur = route.totalDuration;
      if (dist > 20 || dur > 40) return 'HIGH';
      if (dist > 10 || dur > 20) return 'MEDIUM';
      return 'LOW';
    };

    const sortedRoutes = [...routes].sort((a, b) => {
      const pMap: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return pMap[getPriority(a)] - pMap[getPriority(b)];
    });

    const busSchedulesCount = new Map<number, number>();
    buses.forEach(b => {
      const count = existingSchedules.filter(s => s.busId === b.id).length;
      busSchedulesCount.set(b.id, count);
    });

    const driverSchedulesCount = new Map<number, number>();
    drivers.forEach(d => {
      const count = existingSchedules.filter(s => s.driverId === d.id).length;
      driverSchedulesCount.set(d.id, count);
    });

    const proposedSchedules: any[] = [];
    let automaticallyResolvedCount = 0;

    const getDriverDailyDuration = (driverId: number, proposed: any[]) => {
      const dbSchedules = existingSchedules.filter(s => s.driverId === driverId);
      const dbDuration = dbSchedules.reduce((sum, s) => {
        return sum + (s.route ? s.route.totalDuration : 0);
      }, 0);
      const propDuration = proposed.filter(p => p.driverId === driverId).reduce((sum, p) => {
        const routeObj = routes.find(r => r.id === p.routeId);
        return sum + (routeObj ? routeObj.totalDuration : 0);
      }, 0);
      return dbDuration + propDuration;
    };

    const getDriverAllSchedulesForDay = (driverId: number, proposed: any[]) => {
      const dbSchedules = existingSchedules.filter(s => s.driverId === driverId).map(s => ({
        departureTime: s.departureTime,
        arrivalTime: s.arrivalTime,
        routeId: s.routeId,
        totalDuration: s.route ? s.route.totalDuration : 0
      }));
      const propSchedules = proposed.filter(p => p.driverId === driverId).map(p => {
        const routeObj = routes.find(r => r.id === p.routeId);
        return {
          departureTime: p.departureTime,
          arrivalTime: p.arrivalTime,
          routeId: p.routeId,
          totalDuration: routeObj ? routeObj.totalDuration : 0
        };
      });
      return [...dbSchedules, ...propSchedules];
    };

    for (const route of sortedRoutes) {
      // Step 1.2: Check existing timings in the DB or fallback to defaults
      const routeScheds = existingSchedules.filter(s => s.routeId === route.id);
      let targetTimes = Array.from(new Set(routeScheds.map(s => s.departureTime))).sort();
      if (targetTimes.length === 0) {
        targetTimes = ["08:00", "10:30", "13:30", "16:00", "18:30"];
      }

      for (const departureTime of targetTimes) {
        const isDuplicate = existingSchedules.some(s => s.routeId === route.id && s.departureTime === departureTime);
        if (isDuplicate) continue;

        const startMins = timeToMinutes(departureTime);
        const endMins = (startMins + route.totalDuration) % 1440;
        const arrivalHours = Math.floor(endMins / 60).toString().padStart(2, '0');
        const arrivalMins = (endMins % 60).toString().padStart(2, '0');
        const arrivalTime = `${arrivalHours}:${arrivalMins}`;

        // Find available bus
        const availableBuses = activeBuses.filter(bus => {
          const hasDbOverlap = existingSchedules.some(s => s.busId === bus.id && hasOverlap(startMins, endMins, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime)));
          const hasPropOverlap = proposedSchedules.some(p => p.busId === bus.id && hasOverlap(startMins, endMins, timeToMinutes(p.departureTime), timeToMinutes(p.arrivalTime)));
          return !hasDbOverlap && !hasPropOverlap;
        });

        // Balance bus utilization
        availableBuses.sort((a, b) => (busSchedulesCount.get(a.id) || 0) - (busSchedulesCount.get(b.id) || 0));
        const selectedBus = availableBuses[0];

        // Find available driver
        const availableDrivers = activeDrivers.filter(driver => {
          const hasDbOverlap = existingSchedules.some(s => s.driverId === driver.id && hasOverlap(startMins, endMins, timeToMinutes(s.departureTime), timeToMinutes(s.arrivalTime)));
          const hasPropOverlap = proposedSchedules.some(p => p.driverId === driver.id && hasOverlap(startMins, endMins, timeToMinutes(p.departureTime), timeToMinutes(p.arrivalTime)));
          if (hasDbOverlap || hasPropOverlap) return false;

          // Driver Duty Validation
          const currentDailyDur = getDriverDailyDuration(driver.id, proposedSchedules);
          if (currentDailyDur + route.totalDuration > 480) return false;

          const allDriverScheds = getDriverAllSchedulesForDay(driver.id, proposedSchedules);
          if (allDriverScheds.length >= 3) return false;

          for (const s of allDriverScheds) {
            const sStart = timeToMinutes(s.departureTime);
            const sEnd = timeToMinutes(s.arrivalTime);
            
            if (sStart >= endMins) {
              if (sStart - endMins < 30) return false;
            }
            if (startMins >= sEnd) {
              if (startMins - sEnd < 30) return false;
            }
          }

          return true;
        });

        // Balance driver workload
        availableDrivers.sort((a, b) => (driverSchedulesCount.get(a.id) || 0) - (driverSchedulesCount.get(b.id) || 0));
        const selectedDriver = availableDrivers[0];

        if (selectedBus && selectedDriver) {
          busSchedulesCount.set(selectedBus.id, (busSchedulesCount.get(selectedBus.id) || 0) + 1);
          driverSchedulesCount.set(selectedDriver.id, (driverSchedulesCount.get(selectedDriver.id) || 0) + 1);

          proposedSchedules.push({
            routeId: route.id,
            busId: selectedBus.id,
            driverId: selectedDriver.id,
            departureTime,
            arrivalTime,
            recurrence: 'DAILY',
            status: 'ACTIVE',
            route,
            bus: selectedBus,
            driver: selectedDriver,
            reasonGenerated: [
              '✓ Bus available',
              '✓ Driver available',
              '✓ Route active',
              '✓ Driver workload balanced',
              '✓ No maintenance',
              '✓ No schedule conflict'
            ]
          });
        } else {
          // Fallback with conflict flagging
          const fallbackBus = selectedBus || activeBuses[0] || buses[0];
          const fallbackDriver = selectedDriver || activeDrivers[0] || drivers[0];

          if (fallbackBus && fallbackDriver) {
            proposedSchedules.push({
              routeId: route.id,
              busId: fallbackBus.id,
              driverId: fallbackDriver.id,
              departureTime,
              arrivalTime,
              recurrence: 'DAILY',
              status: 'ACTIVE',
              route,
              bus: fallbackBus,
              driver: fallbackDriver,
              reasonGenerated: [
                selectedBus ? '✓ Bus available' : '⚠ Bus conflicts detected',
                selectedDriver ? '✓ Driver available' : '⚠ Driver duty/conflict warnings',
                '✓ Route active'
              ]
            });
            automaticallyResolvedCount++;
          }
        }
      }
    }

    const validationResult = await runBatchValidation(proposedSchedules, existingSchedules, buses, drivers, routes, maintenances);

    const schedulesCount = proposedSchedules.length;
    const conflictsCount = validationResult.conflicts.length;
    const successRate = schedulesCount > 0 ? Math.round(((schedulesCount - conflictsCount) / schedulesCount) * 100) : 100;

    const summary = {
      schedulesGenerated: schedulesCount,
      conflictsFound: conflictsCount,
      automaticallyResolved: automaticallyResolvedCount,
      pendingApproval: schedulesCount,
      generationTime: new Date().toISOString(),
      successRate: successRate
    };

    res.status(200).json({
      success: true,
      schedules: proposedSchedules,
      conflicts: validationResult.conflicts,
      summary
    });
  } catch (err) {
    next(err);
  }
};

// 2. Validate Batch (POST)
export const validateBatchSchedules = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { schedules } = req.body;
    if (!schedules || !Array.isArray(schedules)) {
      throw new ApiError(400, 'Invalid schedules list provided');
    }

    const buses = await prisma.bus.findMany();
    const drivers = await prisma.driver.findMany({ include: { user: true } });
    const routes = await prisma.route.findMany();
    const maintenances = await prisma.maintenance.findMany({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }
    });
    const existing = await prisma.schedule.findMany({
      where: { status: 'ACTIVE' },
      include: {
        route: true,
        bus: true,
        driver: { include: { user: true } }
      }
    });

    const validation = await runBatchValidation(schedules, existing, buses, drivers, routes, maintenances);

    res.status(200).json({
      success: true,
      conflicts: validation.conflicts
    });
  } catch (err) {
    next(err);
  }
};

// 3. Approve Batch (POST)
export const approveBatchSchedules = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { schedules, conflictsResolved } = req.body;
    if (!schedules || !Array.isArray(schedules)) {
      throw new ApiError(400, 'Invalid schedules list provided');
    }

    const createdSchedules = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const s of schedules) {
        const route = await tx.route.findUnique({ where: { id: s.routeId } });
        if (!route) {
          throw new ApiError(400, `Route ID ${s.routeId} does not exist`);
        }

        const startMins = timeToMinutes(s.departureTime);
        const endMins = (startMins + route.totalDuration) % 1440;
        const arrivalHours = Math.floor(endMins / 60).toString().padStart(2, '0');
        const arrivalMins = (endMins % 60).toString().padStart(2, '0');
        const arrivalTime = `${arrivalHours}:${arrivalMins}`;

        const record = await tx.schedule.create({
          data: {
            routeId: s.routeId,
            busId: s.busId,
            driverId: s.driverId,
            departureTime: s.departureTime,
            arrivalTime: arrivalTime,
            recurrence: s.recurrence || 'DAILY',
            status: s.status || 'ACTIVE',
          }
        });
        results.push(record);
      }
      return results;
    });
    
    let userName = 'Administrator';
    if (req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (dbUser) {
        userName = dbUser.name;
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'AUTO_SCHEDULE_LOG',
        details: JSON.stringify({
          generationTime: new Date().toISOString(),
          generatedBy: userName,
          approvedBy: userName,
          schedulesCount: schedules.length,
          conflictsResolvedCount: conflictsResolved || 0,
          status: 'APPROVED'
        })
      }
    });

    res.status(201).json({
      success: true,
      schedules: createdSchedules
    });
  } catch (err) {
    next(err);
  }
};

// 4. Get Schedule History (GET)
export const getScheduleHistory = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'AUTO_SCHEDULE_LOG' },
      orderBy: { createdAt: 'desc' }
    });

    const history = logs.map(log => {
      let parsed = {
        generationTime: log.createdAt.toISOString(),
        generatedBy: 'Automated Engine',
        approvedBy: 'Administrator',
        schedulesCount: 0,
        conflictsResolvedCount: 0,
        status: 'APPROVED'
      };
      try {
        if (log.details) {
          parsed = { ...parsed, ...JSON.parse(log.details) };
        }
      } catch (e) {
        // fallback
      }
      return {
        id: log.id,
        generationTime: parsed.generationTime,
        generatedBy: parsed.generatedBy,
        approvedBy: parsed.approvedBy,
        schedulesCreated: parsed.schedulesCount,
        conflictsResolved: parsed.conflictsResolvedCount,
        status: parsed.status
      };
    });

    res.status(200).json({
      success: true,
      history
    });
  } catch (err) {
    next(err);
  }
};

// 5. Get Reschedule Suggestions (GET)
export const getRescheduleSuggestions = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const activeSchedules = await prisma.schedule.findMany({
      where: { status: 'ACTIVE' },
      include: {
        route: true,
        bus: true,
        driver: { include: { user: true } }
      }
    });

    const buses = await prisma.bus.findMany();
    const drivers = await prisma.driver.findMany({ include: { user: true } });
    const maintenances = await prisma.maintenance.findMany({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }
    });

    const maintenanceBusIds = new Set(maintenances.map(m => m.busId));
    const activeBuses = buses.filter(b => b.status !== 'INACTIVE' && b.status !== 'MAINTENANCE' && !maintenanceBusIds.has(b.id));
    const activeDrivers = drivers.filter(d => d.availabilityStatus === 'AVAILABLE' || d.availabilityStatus === 'ON_DUTY');

    const busSchedulesCount = new Map<number, number>();
    buses.forEach(b => {
      const count = activeSchedules.filter(s => s.busId === b.id).length;
      busSchedulesCount.set(b.id, count);
    });

    const driverSchedulesCount = new Map<number, number>();
    drivers.forEach(d => {
      const count = activeSchedules.filter(s => s.driverId === d.id).length;
      driverSchedulesCount.set(d.id, count);
    });

    const suggestions: any[] = [];

    for (const s of activeSchedules) {
      const isBusMaint = maintenanceBusIds.has(s.busId) || s.bus.status === 'MAINTENANCE';
      const isBusInactive = s.bus.status === 'INACTIVE';
      const isDriverInactive = s.driver.availabilityStatus === 'OFF_DUTY' || s.driver.availabilityStatus === 'SUSPENDED';

      const sStart = timeToMinutes(s.departureTime);
      const sEnd = timeToMinutes(s.arrivalTime);

      if (isBusMaint || isBusInactive || isDriverInactive) {
        let suggestedBus = null;
        let suggestedDriver = null;
        let reason = '';
        let conflictType = '';

        if (isBusMaint || isBusInactive) {
          conflictType = isBusMaint ? 'Bus Under Maintenance' : 'Bus Inactive';
          reason = `Assigned Bus ${s.bus.registrationNumber} is ${isBusMaint ? 'under maintenance' : 'inactive'}.`;
          
          const alternatives = activeBuses.filter(b => {
            return !activeSchedules.some(sched => sched.busId === b.id && hasOverlap(sStart, sEnd, timeToMinutes(sched.departureTime), timeToMinutes(sched.arrivalTime)));
          });
          alternatives.sort((a, b) => (busSchedulesCount.get(a.id) || 0) - (busSchedulesCount.get(b.id) || 0));
          if (alternatives.length > 0) {
            suggestedBus = alternatives[0];
          }
        }

        if (isDriverInactive) {
          conflictType = conflictType ? 'Multiple Conflicts' : 'Driver Inactive';
          reason = reason ? reason + ` Assigned Driver is inactive.` : `Assigned Driver ${s.driver.user ? s.driver.user.name : s.driver.licenseNumber} is inactive.`;

          const alternatives = activeDrivers.filter(d => {
            const noOverlap = !activeSchedules.some(sched => sched.driverId === d.id && hasOverlap(sStart, sEnd, timeToMinutes(sched.departureTime), timeToMinutes(sched.arrivalTime)));
            if (!noOverlap) return false;

            const dailyDur = activeSchedules.filter(sched => sched.driverId === d.id).reduce((sum, sched) => sum + (sched.route ? sched.route.totalDuration : 0), 0);
            if (dailyDur + s.route.totalDuration > 480) return false;

            return true;
          });
          alternatives.sort((a, b) => (driverSchedulesCount.get(a.id) || 0) - (driverSchedulesCount.get(b.id) || 0));
          if (alternatives.length > 0) {
            suggestedDriver = alternatives[0];
          }
        }

        suggestions.push({
          scheduleId: s.id,
          schedule: s,
          conflictType,
          reason,
          suggestedBus,
          suggestedDriver
        });
      }
    }

    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (err) {
    next(err);
  }
};

// 6. Get Scheduling Analytics (GET)
export const getSchedulingAnalytics = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const buses = await prisma.bus.findMany();
    const drivers = await prisma.driver.findMany({ include: { user: true } });
    const routes = await prisma.route.findMany();
    const activeSchedules = await prisma.schedule.findMany({
      where: { status: 'ACTIVE' },
      include: { route: true, bus: true, driver: true }
    });
    const maintenances = await prisma.maintenance.findMany({
      where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }
    });

    const maintenanceBusIds = new Set(maintenances.map(m => m.busId));

    const totalActiveBuses = buses.filter(b => b.status !== 'INACTIVE').length;
    const totalDrivers = drivers.length;
    
    const assignedDriversSet = new Set(activeSchedules.map(s => s.driverId));
    const driversAssigned = assignedDriversSet.size;

    const availableDrivers = drivers.filter(d => d.availabilityStatus === 'AVAILABLE').length;
    const totalScheduledTrips = activeSchedules.length;

    const busesUnderMaint = buses.filter(b => b.status === 'MAINTENANCE' || maintenanceBusIds.has(b.id)).length;

    const activeDriversCount = drivers.filter(d => d.availabilityStatus === 'AVAILABLE' || d.availabilityStatus === 'ON_DUTY').length;
    const driverUtilization = activeDriversCount > 0 ? Math.round((driversAssigned / activeDriversCount) * 100) : 0;

    const assignedBusesSet = new Set(activeSchedules.map(s => s.busId));
    const busUtilization = totalActiveBuses > 0 ? Math.round((assignedBusesSet.size / totalActiveBuses) * 100) : 0;

    const assignedRoutesSet = new Set(activeSchedules.map(s => s.routeId));
    const routeUtilization = routes.length > 0 ? Math.round((assignedRoutesSet.size / routes.length) * 100) : 0;

    const validation = await runBatchValidation([], activeSchedules, buses, drivers, routes, maintenances);
    const conflictCount = validation.conflicts.length;

    res.status(200).json({
      success: true,
      analytics: {
        totalActiveBuses,
        totalDrivers,
        driversAssigned,
        availableDrivers,
        totalScheduledTrips,
        busesUnderMaintenance: busesUnderMaint,
        driverUtilization,
        busUtilization,
        routeUtilization,
        conflictCount
      }
    });
  } catch (err) {
    next(err);
  }
};

