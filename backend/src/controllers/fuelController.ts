import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod schemas
export const fuelLogSchema = z.object({
  body: z.object({
    busId: z.number().int(),
    fuelQuantity: z.number().min(0.1),
    odometerReading: z.number().min(1),
    cost: z.number().min(0),
    date: z.string().transform((str) => new Date(str)),
  }),
});

export const getAllFuelLogs = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const logs = await prisma.fuelLog.findMany({
      include: { bus: true },
      orderBy: { date: 'desc' },
    });

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (err) {
    next(err);
  }
};

export const createFuelLog = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { busId, fuelQuantity, odometerReading, cost, date } = req.body;

    const bus = await prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) {
      throw new ApiError(404, 'Bus vehicle not found');
    }

    // Verify odometer sequence (should not decrease)
    const lastLog = await prisma.fuelLog.findFirst({
      where: { busId },
      orderBy: { odometerReading: 'desc' },
    });

    if (lastLog && odometerReading < Number(lastLog.odometerReading)) {
      throw new ApiError(
        400,
        `Odometer reading cannot be lower than the previous logged value (${lastLog.odometerReading} km)`
      );
    }

    const log = await prisma.fuelLog.create({
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
  } catch (err) {
    next(err);
  }
};
