import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod Validation schemas
export const busCreateSchema = z.object({
  body: z.object({
    registrationNumber: z.string().min(3, 'Registration number must be valid'),
    model: z.string().min(2, 'Model name is required'),
    capacity: z.number().int().min(1, 'Capacity must be at least 1 seat'),
    status: z.enum(['AVAILABLE', 'RUNNING', 'MAINTENANCE', 'INACTIVE']).optional(),
    category: z.enum(['AC_SEATER', 'NON_AC_SEATER', 'AC_SLEEPER', 'NON_AC_SLEEPER']).optional(),
  }),
});

export const documentUploadSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Document title is required'),
    documentType: z.enum(['PERMIT', 'FITNESS', 'INSURANCE', 'LICENSE']),
    fileUrl: z.string().url('File URL must be a valid location link'),
    expiryDate: z.string().transform((str) => new Date(str)),
  }),
});

export const getAllBuses = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { status, category, search } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status as string;
    if (category) whereClause.category = category as string;
    if (search) {
      whereClause.OR = [
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const buses = await prisma.bus.findMany({
      where: whereClause,
      include: {
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      buses,
    });
  } catch (err) {
    next(err);
  }
};

export const getBusById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const busId = parseInt(req.params.id, 10);
    if (isNaN(busId)) {
      throw new ApiError(400, 'Invalid bus identifier');
    }

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        documents: true,
        maintenances: true,
        fuelLogs: true,
        schedules: {
          include: {
            route: true,
            driver: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!bus) {
      throw new ApiError(404, 'Bus vehicle not found');
    }

    res.status(200).json({
      success: true,
      bus,
    });
  } catch (err) {
    next(err);
  }
};

export const createBus = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { registrationNumber, model, capacity, status, category } = req.body;

    const existingBus = await prisma.bus.findUnique({
      where: { registrationNumber },
    });

    if (existingBus) {
      throw new ApiError(400, 'A bus with this registration number already exists');
    }

    const bus = await prisma.bus.create({
      data: {
        registrationNumber,
        model,
        capacity,
        status: status || 'AVAILABLE',
        category: category || 'NON_AC_SEATER',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_BUS',
        details: `Created vehicle KA-${registrationNumber} (ID: ${bus.id})`,
      },
    });

    res.status(201).json({
      success: true,
      bus,
    });
  } catch (err) {
    next(err);
  }
};

export const updateBus = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const busId = parseInt(req.params.id, 10);
    const { registrationNumber, model, capacity, status, category } = req.body;

    if (isNaN(busId)) {
      throw new ApiError(400, 'Invalid bus identifier');
    }

    // Verify status transition
    const busRecord = await prisma.bus.findUnique({ where: { id: busId } });
    if (!busRecord) {
      throw new ApiError(404, 'Bus vehicle not found');
    }

    if (registrationNumber && registrationNumber !== busRecord.registrationNumber) {
      const regDup = await prisma.bus.findUnique({ where: { registrationNumber } });
      if (regDup) {
        throw new ApiError(400, 'Another bus already uses this registration number');
      }
    }

    const updatedBus = await prisma.bus.update({
      where: { id: busId },
      data: {
        registrationNumber,
        model,
        capacity,
        status,
        category,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_BUS',
        details: `Updated vehicle properties for ID: ${busId}`,
      },
    });

    res.status(200).json({
      success: true,
      bus: updatedBus,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteBus = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const busId = parseInt(req.params.id, 10);
    if (isNaN(busId)) {
      throw new ApiError(400, 'Invalid bus identifier');
    }

    const busRecord = await prisma.bus.findUnique({ where: { id: busId } });
    if (!busRecord) {
      throw new ApiError(404, 'Bus vehicle not found');
    }

    // Restrict deletion if bus is actively referenced in schedules
    const activeSchedule = await prisma.schedule.findFirst({
      where: { busId, status: 'ACTIVE' },
    });
    if (activeSchedule) {
      throw new ApiError(400, 'Cannot delete a bus that is currently assigned to an active schedule');
    }

    await prisma.bus.delete({
      where: { id: busId },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_BUS',
        details: `Deleted vehicle registration: ${busRecord.registrationNumber}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const uploadBusDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const busId = parseInt(req.params.id, 10);
    if (isNaN(busId)) {
      throw new ApiError(400, 'Invalid bus identifier');
    }

    const bus = await prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) {
      throw new ApiError(404, 'Bus vehicle not found');
    }

    const { title, documentType, fileUrl, expiryDate } = req.body;

    const doc = await prisma.document.create({
      data: {
        title,
        documentType,
        fileUrl,
        expiryDate,
        busId,
      },
    });

    res.status(201).json({
      success: true,
      document: doc,
    });
  } catch (err) {
    next(err);
  }
};
