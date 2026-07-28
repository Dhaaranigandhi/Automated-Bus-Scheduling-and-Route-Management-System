import { Router } from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  logAttendance,
  driverCreateSchema,
  attendanceLogSchema,
} from '../controllers/driverController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllDrivers);
router.get('/:id', getDriverById);

router.post(
  '/',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(driverCreateSchema),
  createDriver
);

router.put(
  '/:id',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(driverCreateSchema),
  updateDriver
);

router.delete('/:id', restrictTo('Super Administrator', 'Transport Manager'), deleteDriver);

router.post('/attendance', validate(attendanceLogSchema), logAttendance);

export default router;
