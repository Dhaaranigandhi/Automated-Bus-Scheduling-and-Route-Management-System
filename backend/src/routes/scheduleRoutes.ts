import { Router } from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAIScheduleRecommendation,
  scheduleCreateSchema,
} from '../controllers/scheduleController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllSchedules);
router.get('/recommend', getAIScheduleRecommendation);
router.get('/:id', getScheduleById);

router.post(
  '/',
  restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'),
  validate(scheduleCreateSchema),
  createSchedule
);

router.put(
  '/:id',
  restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'),
  validate(scheduleCreateSchema),
  updateSchedule
);

router.delete(
  '/:id',
  restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'),
  deleteSchedule
);

export default router;
