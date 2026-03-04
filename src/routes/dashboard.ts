import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/content', authMiddleware as any, DashboardController.getDashboardContent as any);

export default router;
