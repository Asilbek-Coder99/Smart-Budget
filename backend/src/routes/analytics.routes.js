import { Router } from 'express';
import { getOverview, getInsights } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/overview', getOverview);
router.get('/insights', getInsights);

export default router;
