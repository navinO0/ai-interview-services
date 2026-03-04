import { Difficulty } from '../enums/common';

export interface WorkspaceStep {
    id: string;
    workspace_id: string;
    title: string;
    description: string;
    completed: boolean;
    estimated_days: number;
    order_index: number;
    created_at?: string;
    updated_at?: string;
}

export interface Workspace {
    id: string;
    user_id: string;
    title: string;
    goal: string;
    category: string;
    difficulty: Difficulty;
    progress: number;
    color: string;
    notes: string;
    last_accessed_at: string;
    created_at: string;
    updated_at: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'stopped';
    generation_progress: number;
    error_log?: string;
    target_days?: number;
    learner_level?: string;
    steps?: WorkspaceStep[];
}
