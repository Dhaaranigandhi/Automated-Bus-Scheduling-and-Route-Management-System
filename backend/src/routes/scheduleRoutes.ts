import { Router } from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAIScheduleRecommendation,
  scheduleCreateSchema,
  autoGenerateSchedules,
  validateBatchSchedules,
  approveBatchSchedules,
  getScheduleHistory,
  getRescheduleSuggestions,
  getSchedulingAnalytics,
} from '../controllers/scheduleController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllSchedules);
router.get('/recommend', getAIScheduleRecommendation);
router.get('/history', restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'), getScheduleHistory);
router.get('/reschedule-suggestions', restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'), getRescheduleSuggestions);
router.get('/analytics', restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'), getSchedulingAnalytics);
router.get('/:id', getScheduleById);

router.post('/auto-generate', restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'), autoGenerateSchedules);
router.post('/validate-batch', restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'), validateBatchSchedules);
router.post('/approve-batch', restrictTo('Super Administrator', 'Transport Manager', 'Scheduler'), approveBatchSchedules);

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

