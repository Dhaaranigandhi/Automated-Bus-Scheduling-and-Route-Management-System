import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

// Zod schemas
export const settingUpdateSchema = z.object({
  body: z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  }),
});

export const getSettings = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const settings = await prisma.setting.findMany();
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSetting = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { key, value } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    res.status(200).json({
      success: true,
      setting,
    });
  } catch (err) {
    next(err);
  }
};
