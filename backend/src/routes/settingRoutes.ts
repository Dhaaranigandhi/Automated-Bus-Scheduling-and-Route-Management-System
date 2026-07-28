import { Router } from 'express';
import { getSettings, updateSetting, settingUpdateSchema } from '../controllers/settingController';
import { authGuard, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/', getSettings);
router.post('/', restrictTo('Super Administrator'), validate(settingUpdateSchema), updateSetting);

export default router;
