import { Router } from 'express';
import * as InterviewController from '../controllers/InterviewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/interview/sessions:
 *   get:
 *     summary: List user interview sessions
 *     tags: [Interview]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of interview sessions
 */
router.get('/sessions', InterviewController.listSessions as any);

/**
 * @swagger
 * /api/interview/start:
 *   post:
 *     summary: Start a new interview session
 *     tags: [Interview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobDescription:
 *                 type: string
 *               resumeText:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               questionCount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Interview session details
 */
router.post('/start', InterviewController.startInterview as any);

/**
 * @swagger
 * /api/interview/answer:
 *   post:
 *     summary: Submit an answer to an interview question
 *     tags: [Interview]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evaluation and next question
 */
router.post('/answer', InterviewController.answerQuestion as any);

/**
 * @swagger
 * /api/interview/{id}/report:
 *   get:
 *     summary: Get an interview session report
 *     tags: [Interview]
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
 *         description: Detailed feedback report
 */
router.get('/:id/report', InterviewController.getReport as any);


export default router;
