import { Router } from 'express';
import { WorkspaceController } from '../controllers/WorkspaceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /api/workspaces:
 *   get:
 *     tags:
 *       - Workspaces
 *     summary: List all workspaces for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces retrieved
 *   post:
 *     tags:
 *       - Workspaces
 *     summary: Create a new workspace
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 */
router.get('/', WorkspaceController.list as any);
router.post('/', WorkspaceController.create as any);

/**
 * @openapi
 * /api/workspaces/{id}:
 *   get:
 *     tags:
 *       - Workspaces
 *     summary: Get a workspace by ID
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
 *         description: Workspace details retrieved
 *   patch:
 *     tags:
 *       - Workspaces
 *     summary: Update a workspace
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workspace updated
 *   delete:
 *     tags:
 *       - Workspaces
 *     summary: Delete a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Workspace deleted
 */
router.get('/:id', WorkspaceController.get as any);
router.patch('/:id', WorkspaceController.update as any);
router.delete('/:id', WorkspaceController.delete as any);

/**
 * @openapi
 * /api/workspaces/{id}/complete-step:
 *   post:
 *     tags:
 *       - Workspaces
 *     summary: Mark a step as complete within a workspace
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
 *             required:
 *               - stepId
 *             properties:
 *               stepId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Step marked as complete
 */
router.post('/:id/complete-step', WorkspaceController.completeStep as any);

/**
 * @openapi
 * /api/workspaces/{id}/retry:
 *   post:
 *     tags:
 *       - Workspaces
 *     summary: Retry a failed or stopped workspace roadmap generation
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
 *         description: Workspace successfully re-queued
 *       400:
 *         description: Cannot retry workspace in current status
 */
router.post('/:id/retry', WorkspaceController.retry as any);

/**
 * @openapi
 * /api/workspaces/{id}/touch:
 *   post:
 *     tags:
 *       - Workspaces
 *     summary: Update the 'last accessed' timestamp of a workspace
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
 *         description: Last accessed timestamp updated
 */
router.post('/:id/touch', WorkspaceController.touch as any);
router.patch('/:id/notes', WorkspaceController.updateNotes as any);

export default router;
