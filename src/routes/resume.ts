import { Router } from 'express';
import multer from 'multer';
import * as ResumeController from '../controllers/ResumeController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /api/resume/upload:
 *   post:
 *     tags:
 *       - Resume
 *     summary: Upload a resume PDF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resume uploaded and parsed successfully
 */
router.post('/upload', upload.single('resume'), ResumeController.uploadResume as any);

/**
 * @openapi
 * /api/resume/latest:
 *   get:
 *     tags:
 *       - Resume
 *     summary: Get the latest uploaded resume
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest resume metadata and content retrieved
 */
router.get('/latest', ResumeController.getLatestResume as any);

export default router;
