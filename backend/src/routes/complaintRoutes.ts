import { Router } from 'express';
import {
  getAllComplaints,
  createComplaint,
  resolveComplaint,
  complaintCreateSchema,
} from '../controllers/complaintController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getAllComplaints);

router.post(
  '/',
  restrictTo('Student/Passenger', 'Faculty/Employee'),
  validate(complaintCreateSchema),
  createComplaint
);

router.put(
  '/:id/resolve',
  restrictTo('Super Administrator', 'Transport Manager'),
  resolveComplaint
);

export default router;
