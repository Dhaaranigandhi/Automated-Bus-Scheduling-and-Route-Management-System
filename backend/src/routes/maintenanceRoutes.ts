import { Router } from 'express';
import {
  getAllMaintenances,
  createMaintenance,
  updateMaintenanceStatus,
  maintenanceCreateSchema,
} from '../controllers/maintenanceController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllMaintenances);

router.post(
  '/',
  restrictTo('Super Administrator', 'Maintenance Manager'),
  validate(maintenanceCreateSchema),
  createMaintenance
);

router.put(
  '/:id/status',
  restrictTo('Super Administrator', 'Maintenance Manager'),
  updateMaintenanceStatus
);

export default router;
