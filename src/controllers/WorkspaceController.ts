import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import WorkspaceService from '../services/WorkspaceService';
import config from '../config/env';

export class WorkspaceController {
    static async list(req: AuthenticatedRequest, res: Response) {
        try {
            const workspaces = await WorkspaceService.listWorkspaces(req.user.id);
            res.json(workspaces);
        } catch (error: any) {
            console.error('List Workspaces Error:', error);
            res.status(500).json({
                error: 'Failed to fetch workspaces',
                details: config.logging.debug ? error.message : undefined
            });
        }
    }

    static async get(req: AuthenticatedRequest, res: Response) {
        try {
            const workspace = await WorkspaceService.getWorkspace(req.user.id, req.params.id);
            if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
            res.json(workspace);
        } catch (error: any) {
            console.error('Get Workspace Error:', error);
            res.status(500).json({
                error: 'Failed to fetch workspace',
                details: config.logging.debug ? error.message : undefined
            });
        }
    }

    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            const workspace = await WorkspaceService.createWorkspace(req.user.id, req.body);
            res.status(201).json(workspace);
        } catch (error: any) {
            console.error('Create Workspace Error:', error);
            res.status(500).json({
                error: 'Failed to create workspace',
                details: config.logging.debug ? error.message : undefined
            });
        }
    }

    static async update(req: AuthenticatedRequest, res: Response) {
        try {
            const workspace = await WorkspaceService.updateWorkspace(req.user.id, req.params.id, req.body);
            res.json(workspace);
        } catch (error) {
            console.error('Update Workspace Error:', error);
            res.status(500).json({ error: 'Failed to update workspace' });
        }
    }

    static async delete(req: AuthenticatedRequest, res: Response) {
        try {
            await WorkspaceService.deleteWorkspace(req.user.id, req.params.id);
            res.status(204).end();
        } catch (error) {
            console.error('Delete Workspace Error:', error);
            res.status(500).json({ error: 'Failed to delete workspace' });
        }
    }

    static async completeStep(req: AuthenticatedRequest, res: Response) {
        try {
            const { stepId } = req.body;
            const workspace = await WorkspaceService.completeStep(req.user.id, req.params.id, stepId);
            res.json(workspace);
        } catch (error) {
            console.error('Complete Step Error:', error);
            res.status(500).json({ error: 'Failed to complete step' });
        }
    }

    static async retry(req: AuthenticatedRequest, res: Response) {
        try {
            const workspace = await WorkspaceService.retryWorkspace(req.user.id, req.params.id);
            res.json(workspace);
        } catch (error: any) {
            console.error('Retry Workspace Error:', error);
            res.status(400).json({ error: error.message || 'Failed to retry workspace' });
        }
    }

    static async touch(req: AuthenticatedRequest, res: Response) {
        try {
            await WorkspaceService.touchWorkspace(req.user.id, req.params.id);
            res.status(204).end();
        } catch (error) {
            console.error('Touch Workspace Error:', error);
            res.status(500).json({ error: 'Failed to update access time' });
        }
    }

    static async updateNotes(req: AuthenticatedRequest, res: Response) {
        try {
            const { notes } = req.body;
            await WorkspaceService.updateNotes(req.user.id, req.params.id, notes);
            res.status(204).end();
        } catch (error) {
            console.error('Update Notes Error:', error);
            res.status(500).json({ error: 'Failed to update notes' });
        }
    }
}
