import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import authRoutes from './auth';
import resumeRoutes from './resume';
import interviewRoutes from './interview';
import contentRoutes from './content';
import practiceRoutes from './practice';
import chatRoutes from './chat';
import roadmapRoutes from './roadmap';
import aiRoutes from './ai';
import workspacesRoutes from './workspaces';
import searchRoutes from './search';
import topicRoutes from './topics';
import notesRoutes from './notes';
import aiSettingsRoutes from './aiSettings';
import dashboardRoutes from './dashboard';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes (apply authMiddleware before mounting)
router.use(authMiddleware as any);

router.use('/resume', resumeRoutes);
router.use('/interview', interviewRoutes);
router.use('/content', contentRoutes);
router.use('/practice', practiceRoutes);
router.use('/chat', chatRoutes);
router.use('/roadmap', roadmapRoutes);
router.use('/ai', aiRoutes);
router.use('/workspaces', workspacesRoutes);
router.use('/search', searchRoutes);
router.use('/topics', topicRoutes);
router.use('/notes', notesRoutes);
router.use('/ai-settings', aiSettingsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
