import { Router } from 'express';
import {
  startTrip,
  endTrip,
  logGPSLocation,
  getTripPlayback,
  getLiveTrips,
  gpsLogSchema,
} from '../controllers/tripController';
import { authGuard } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authGuard);

router.get('/live', getLiveTrips);
router.post('/start', startTrip);
router.post('/:id/end', endTrip);
router.post('/:id/gps', validate(gpsLogSchema), logGPSLocation);
router.get('/:id/playback', getTripPlayback);

export default router;
