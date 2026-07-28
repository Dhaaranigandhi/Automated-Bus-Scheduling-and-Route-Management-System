import { Router } from 'express';
import { getDashboardStats, getMonthlyReport } from '../controllers/reportController';
import { authGuard } from '../middlewares/auth';

const router = Router();

router.use(authGuard);

router.get('/stats', getDashboardStats);
router.get('/monthly', getMonthlyReport);

export default router;
