import { Router } from 'express';
import { PracticeController } from '../controllers/PracticeController';
import { PlaygroundController } from '../controllers/PlaygroundController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/practice/challenges:
 *   get:
 *     summary: Fetch practice challenges
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Topic category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type of challenge (e.g. CODING)
 *     responses:
 *       200:
 *         description: A list of practice challenges
 */
router.get('/challenges', PracticeController.getChallenges);

/**
 * @swagger
 * /api/practice/mcq/adaptive:
 *   post:
 *     summary: Get an adaptive MCQ challenge
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               session_history:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: An adaptive MCQ question
 */
router.post('/mcq/adaptive', PracticeController.getAdaptiveChallenge as any);

/**
 * @swagger
 * /api/practice/submit:
 *   post:
 *     summary: Submit a solution for a challenge
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               solution:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solution evaluation feedback
 */
router.post('/submit', PracticeController.submitSolution as any);

/**
 * @swagger
 * /api/practice/learning-paths:
 *   get:
 *     summary: Get user learning paths
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of learning paths
 */
router.get('/learning-paths', PracticeController.getLearningPaths);

/**
 * @swagger
 * /api/practice/mcq/history:
 *   get:
 *     summary: Get historic MCQ attempts
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User MCQ history
 */
router.get('/mcq/history', PracticeController.getMcqHistory as any);

/**
 * @swagger
 * /api/practice/dsa/history:
 *   get:
 *     summary: Get historic DSA attempts
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User DSA history
 */
router.get('/dsa/history', PracticeController.getDsaHistory as any);

/**
 * @swagger
 * /api/practice/run:
 *   post:
 *     summary: Execute code locally
 *     tags: [Practice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Execution result
 */
router.post('/run', PracticeController.runCode as any);

// Playground Routes

/**
 * @swagger
 * /api/practice/playground/analyze:
 *   post:
 *     summary: Analyze code for bugs and logic
 *     tags: [Playground]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis logic
 */
router.post('/playground/analyze', PlaygroundController.analyzeCode as any);

/**
 * @swagger
 * /api/practice/playground/suggestions:
 *   post:
 *     summary: Get AI code suggestions
 *     tags: [Playground]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               language:
 *                 type: string
 *               cursorLine:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Code suggestions
 */
router.post('/playground/suggestions', PlaygroundController.getSuggestions as any);

export default router;
