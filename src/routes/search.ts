import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     tags:
 *       - Search
 *     summary: Perform a web search
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/', SearchController.search as any);

/**
 * @openapi
 * /api/search/summary:
 *   get:
 *     tags:
 *       - Search
 *     summary: Get a summarized web search result
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search summary retrieved successfully
 */
router.get('/summary', SearchController.getSummary as any);

export default router;
