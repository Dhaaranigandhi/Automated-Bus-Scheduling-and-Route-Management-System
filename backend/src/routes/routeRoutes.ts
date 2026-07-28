import { Router } from 'express';
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  routeCreateSchema,
} from '../controllers/routeController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

router.post(
  '/',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(routeCreateSchema),
  createRoute
);

router.put(
  '/:id',
  restrictTo('Super Administrator', 'Transport Manager'),
  validate(routeCreateSchema),
  updateRoute
);

router.delete('/:id', restrictTo('Super Administrator', 'Transport Manager'), deleteRoute);

export default router;
