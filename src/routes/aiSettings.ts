import { Router } from 'express';
import { AISettingsController } from '../controllers/AISettingsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/ai-settings:
 *   get:
 *     summary: Get user AI settings
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User AI settings retrieved
 */
router.get('/', AISettingsController.getSettings as any);

/**
 * @swagger
 * /api/ai-settings/save:
 *   post:
 *     summary: Save user AI settings
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ai_provider:
 *                 type: string
 *               model:
 *                 type: string
 *               use_custom_settings:
 *                 type: boolean
 *               api_key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings saved
 */
router.post('/save', AISettingsController.saveSettings as any);

/**
 * @swagger
 * /api/ai-settings/models:
 *   get:
 *     summary: List locally available AI models
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of models
 */
router.get('/models', AISettingsController.listLocalModels as any);

/**
 * @swagger
 * /api/ai-settings/pull:
 *   post:
 *     summary: Pull a new AI model locally
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modelName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pull initiated
 */
router.post('/pull', AISettingsController.pullModel as any);

/**
 * @swagger
 * /api/ai-settings/pull-stream:
 *   get:
 *     summary: Stream the model download progress
 *     tags: [AI Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Server-sent events of pull progress
 */
router.get('/pull-stream', AISettingsController.pullModel as any);

export default router;
