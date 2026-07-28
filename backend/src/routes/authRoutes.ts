import { Router } from 'express';
import { login, signup, refresh, logout, getProfile, loginSchema, signupSchema } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { authGuard } from '../middlewares/auth';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authGuard, logout);
router.get('/profile', authGuard, getProfile);

export default router;
