import { Router } from 'express';
import {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  uploadBusDocument,
  busCreateSchema,
  documentUploadSchema,
} from '../controllers/busController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllBuses);
router.get('/:id', getBusById);

router.post(
  '/',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(busCreateSchema),
  createBus
);

router.put(
  '/:id',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(busCreateSchema),
  updateBus
);

router.delete('/:id', restrictTo('Super Administrator', 'Transport Manager'), deleteBus);

router.post(
  '/:id/documents',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(documentUploadSchema),
  uploadBusDocument
);

export default router;
