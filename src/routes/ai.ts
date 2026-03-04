import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/ai/explain:
 *   post:
 *     tags:
 *       - AI
 *     summary: Get an explanation for a concept
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Streaming explanation
 */
router.post('/explain', AIController.streamExplain as any);

/**
 * @openapi
 * /api/ai/challenge:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate a challenge
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Streaming challenge
 */
router.post('/challenge', AIController.streamChallenge as any);

/**
 * @openapi
 * /api/ai/raw:
 *   post:
 *     tags:
 *       - AI
 *     summary: Direct proxy to Ollama API
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Proxy response
 */
router.post('/raw', AIController.directProxy as any);

export default router;
