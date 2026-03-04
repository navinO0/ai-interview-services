import { Router } from 'express';
import { TopicController } from '../controllers/TopicController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
/**
 * @swagger
 * /api/topics/explain:
 *   get:
 *     summary: Explain a specific topic
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topic explanation
 */
router.get('/explain', TopicController.explainTopic as any);

/**
 * @swagger
 * /api/topics/{id}:
 *   get:
 *     summary: Get a learning path step by ID
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Step details
 */
router.get('/:id', TopicController.getStep as any);

/**
 * @swagger
 * /api/topics/{id}/chat:
 *   post:
 *     summary: Chat with AI about a topic step
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/:id/chat', TopicController.chatWithTopic as any);


export default router;
