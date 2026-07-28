import { Router } from 'express';
import { getAllFuelLogs, createFuelLog, fuelLogSchema } from '../controllers/fuelController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllFuelLogs);

router.post(
  '/',
  restrictTo('Super Administrator', 'Transport Manager', 'Finance Officer'),
  validate(fuelLogSchema),
  createFuelLog
);

export default router;
