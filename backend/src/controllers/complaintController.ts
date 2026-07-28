import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod schemas
export const complaintCreateSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(5),
  }),
});

export const getAllComplaints = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        passenger: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (err) {
    next(err);
  }
};

export const createComplaint = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    const { title, description } = req.body;

    const passenger = await prisma.passenger.findFirst({
      where: { userId },
    });

    if (!passenger) {
      throw new ApiError(403, 'Only registered passenger users can submit complaints');
    }

    const complaint = await prisma.complaint.create({
      data: {
        passengerId: passenger.id,
        title,
        description,
        status: 'SUBMITTED',
      },
    });

    res.status(201).json({
      success: true,
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

export const resolveComplaint = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { resolutionDetails, status } = req.body;

    if (isNaN(id)) {
      throw new ApiError(400, 'Invalid complaint identifier');
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new ApiError(404, 'Complaint ticket not found');
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: status || 'RESOLVED',
        resolutionDetails,
      },
    });

    res.status(200).json({
      success: true,
      complaint: updated,
    });
  } catch (err) {
    next(err);
  }
};
