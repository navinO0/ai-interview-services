import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/chat/history:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 */
router.get('/history', ChatController.getHistory as any);

/**
 * @openapi
 * /api/chat/send:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a chat message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent and response received
 */
router.post('/send', ChatController.sendMessage as any);

export default router;
