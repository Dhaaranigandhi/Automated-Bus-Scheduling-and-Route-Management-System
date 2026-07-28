import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod schemas
export const maintenanceCreateSchema = z.object({
  body: z.object({
    busId: z.number().int(),
    maintenanceType: z.enum(['ROUTINE', 'REPAIR', 'INSPECTION']),
    description: z.string().min(3),
    cost: z.number().min(0),
    scheduledDate: z.string().transform((str) => new Date(str)),
  }),
});

export const getAllMaintenances = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const records = await prisma.maintenance.findMany({
      include: { bus: true },
      orderBy: { scheduledDate: 'desc' },
    });

    res.status(200).json({
      success: true,
      records,
    });
  } catch (err) {
    next(err);
  }
};

export const createMaintenance = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { busId, maintenanceType, description, cost, scheduledDate } = req.body;

    const bus = await prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) {
      throw new ApiError(404, 'Bus vehicle not found');
    }

    const record = await prisma.maintenance.create({
      data: {
        busId,
        maintenanceType,
        description,
        cost,
        scheduledDate,
        status: 'SCHEDULED',
      },
    });

    // Mark bus status as in maintenance
    await prisma.bus.update({
      where: { id: busId },
      data: { status: 'MAINTENANCE' },
    });

    res.status(201).json({
      success: true,
      record,
    });
  } catch (err) {
    next(err);
  }
};

export const updateMaintenanceStatus = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, completedDate } = req.body;

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid maintenance identifier');
    }

    const record = await prisma.maintenance.findUnique({ where: { id } });
    if (!record) {
      throw new ApiError(404, 'Maintenance log not found');
    }

    const updated = await prisma.maintenance.update({
      where: { id },
      data: {
        status,
        completedDate: status === 'COMPLETED' ? (completedDate ? new Date(completedDate) : new Date()) : null,
      },
    });

    // If completed, release the bus status back to AVAILABLE
    if (status === 'COMPLETED') {
      await prisma.bus.update({
        where: { id: record.busId },
        data: { status: 'AVAILABLE' },
      });
    }

    res.status(200).json({
      success: true,
      record: updated,
    });
  } catch (err) {
    next(err);
  }
};
