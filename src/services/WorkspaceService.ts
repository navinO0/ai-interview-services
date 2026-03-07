import db from '../config/db';
import { Workspace, WorkspaceStep } from '../types/workspace';
import { Difficulty } from '../enums/common';
import ai from './aiProviderFactory';

class WorkspaceService {
    async listWorkspaces(userId: string): Promise<Workspace[]> {
        const workspaces = await db('workspaces')
            .where({ user_id: userId })
            .orderBy('last_accessed_at', 'desc');

        for (const ws of workspaces) {
            ws.steps = await db('workspace_steps')
                .where({ workspace_id: ws.id })
                .orderBy('order_index', 'asc');
        }

        return workspaces;
    }

    async getWorkspace(userId: string, id: string): Promise<Workspace | null> {
        const workspace = await db('workspaces')
            .where({ id, user_id: userId })
            .first();

        if (!workspace) return null;

        const steps = await db('workspace_steps')
            .where({ workspace_id: id })
            .orderBy('order_index', 'asc');

        workspace.steps = steps;
        return workspace;
    }

    async createWorkspace(userId: string, data: { title: string; goal: string; category: string; difficulty: Difficulty; color: string; learnerLevel: string; targetDays?: number }): Promise<Workspace> {
        const targetDays = data.targetDays || 10;

        // 1. Check Cache
        const fingerprint = `${data.title}-${data.difficulty}-${data.learnerLevel}`.toLowerCase().replace(/\s+/g, '-');
        const cached = await db('cached_roadmaps').where({ topic_fingerprint: fingerprint }).first();

        const [workspace] = await db('workspaces').insert({
            user_id: userId,
            title: data.title,
            goal: data.goal,
            category: data.category,
            difficulty: data.difficulty,
            color: data.color || '#4F46E5', // Default Indigo
            learner_level: data.learnerLevel || 'Professional',
            target_days: targetDays,
            progress: 0,
            notes: '',
            status: cached ? 'completed' : 'queued',
            generation_progress: cached ? 100 : 0
        }).returning('*');

        if (cached) {
            console.log(`[WorkspaceService] Cache hit for ${fingerprint}. Cloning steps.`);

            let steps = cached.steps_structure;
            if (typeof steps === 'string') {
                try {
                    steps = JSON.parse(steps);
                } catch (e) {
                    console.error('[WorkspaceService] Failed to parse cached steps_structure');
                }
            }

            if (Array.isArray(steps)) {
                await db('workspace_steps').insert(
                    steps.map((s: any, idx: number) => ({
                        workspace_id: workspace.id,
                        title: s.title,
                        description: s.description || 'Learning module details.',
                        day_number: s.day_number || idx + 1,
                        tasks: JSON.stringify(s.tasks || []), // Explicitly stringify for JSONB column reliability
                        estimated_days: 1,
                        order_index: s.order_index ?? idx
                    }))
                );
            }

            workspace.steps = await db('workspace_steps').where({ workspace_id: workspace.id }).orderBy('order_index', 'asc');
            return workspace;
        }

        // 2. Enqueue Job
        const { roadmapQueue } = await import('./QueueService');
        await roadmapQueue.add('roadmap-generation', {
            workspaceId: workspace.id,
            title: data.title,
            goal: data.goal,
            category: data.category,
            difficulty: data.difficulty,
            learnerLevel: data.learnerLevel,
            targetDays
        });

        console.log(`[WorkspaceService] Enqueued roadmap job for ${workspace.id}`);
        return workspace;
    }

    async retryWorkspace(userId: string, workspaceId: string): Promise<Workspace> {
        const workspace = await this.getWorkspace(userId, workspaceId);
        if (!workspace) throw new Error('Workspace not found');

        if (workspace.status !== 'failed' && workspace.status !== 'stopped') {
            throw new Error(`Cannot retry workspace in status: ${workspace.status}`);
        }

        await db('workspaces').where({ id: workspaceId, user_id: userId }).update({
            status: 'queued',
            error_log: null
        });

        const { roadmapQueue } = await import('./QueueService');
        await roadmapQueue.add('roadmap-generation', {
            workspaceId: workspace.id,
            title: workspace.title,
            goal: workspace.goal,
            category: workspace.category,
            difficulty: workspace.difficulty,
            learnerLevel: workspace.learner_level,
            targetDays: workspace.target_days
        });

        console.log(`[WorkspaceService] Re-enqueued roadmap job for ${workspace.id}`);
        return this.getWorkspace(userId, workspaceId) as Promise<Workspace>;
    }

    async updateWorkspace(userId: string, id: string, updates: Partial<Workspace>): Promise<Workspace> {
        const [workspace] = await db('workspaces')
            .where({ id, user_id: userId })
            .update({ ...updates, updated_at: db.fn.now() })
            .returning('*');
        return workspace;
    }

    async deleteWorkspace(userId: string, id: string): Promise<void> {
        await db('workspaces').where({ id, user_id: userId }).del();
    }

    async completeStep(userId: string, workspaceId: string, stepId: string): Promise<Workspace> {
        return db.transaction(async (trx) => {
            const workspace = await trx('workspaces').where({ id: workspaceId, user_id: userId }).first();
            if (!workspace) throw new Error('Workspace not found');

            await trx('workspace_steps')
                .where({ id: stepId, workspace_id: workspaceId })
                .update({ completed: true, updated_at: trx.fn.now() });

            const steps = await trx('workspace_steps')
                .where({ workspace_id: workspaceId })
                .orderBy('order_index', 'asc');

            const completedCount = steps.filter((s: any) => s.completed).length;
            const progress = Math.round((completedCount / steps.length) * 100);

            const [updatedWorkspace] = await trx('workspaces')
                .where({ id: workspaceId })
                .update({ progress, last_accessed_at: trx.fn.now(), updated_at: trx.fn.now() })
                .returning('*');

            updatedWorkspace.steps = steps;
            return updatedWorkspace;
        });
    }

    async touchWorkspace(userId: string, id: string): Promise<void> {
        await db('workspaces')
            .where({ id, user_id: userId })
            .update({ last_accessed_at: db.fn.now() });
    }

    async updateNotes(userId: string, id: string, notes: string): Promise<void> {
        await db('workspaces')
            .where({ id, user_id: userId })
            .update({ notes, updated_at: db.fn.now() });
    }
}

export default new WorkspaceService();
