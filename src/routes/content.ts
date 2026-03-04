import { Router } from 'express';
import * as ContentController from '../controllers/ContentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
/**
 * @openapi
 * /api/content/suggestions:
 *   get:
 *     tags:
 *       - Content
 *     summary: Get content suggestions based on user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content suggestions retrieved
 */
router.get('/suggestions', ContentController.getSuggestions);

export default router;
