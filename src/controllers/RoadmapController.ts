import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import db from '../config/db';
import ai from '../services/aiProviderFactory';

export class RoadmapController {
    static async generateRoadmap(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user!;
            const { goal, experienceLevel, learnerLevel, targetDays } = req.body;
            const days = targetDays || 10;

            if (!goal) {
                return res.status(400).json({ error: 'Goal is required' });
            }

            const prompt = `Generate a detailed DAILY learning roadmap for exactly ${days} days preparing for: "${goal}".
            The user's learner level is: ${learnerLevel || 'Professional'}.
            The technical difficulty: ${experienceLevel || 'Medium'}.
            
            Provide the roadmap as a JSON object:
            {
                "title": "Roadmap Title",
                "description": "Brief description",
                "category": "Exam/Skill Category",
                "level": "Intensity Level",
                "steps": [
                    { "title": "Day 1", "content": "Detailed milestone description", "estimatedDays": 1 }
                ]
            }
            Ensure you return exactly ${days} steps. Return ONLY the JSON.`;

            const systemPrompt = `You are an expert technical interviewer.Return JSON only based on this structure: ${JSON.stringify({
                title: 'string', description: 'string', category: 'string', level: 'string', steps: []
            })
                }. Strict JSON format enforcement.`;

            const roadmapData = await ai.generate(prompt, systemPrompt, true);

            // Save to database
            const [savedRoadmap] = await db('learning_paths').insert({
                title: roadmapData.title,
                description: roadmapData.description,
                category: roadmapData.category,
                level: roadmapData.level,
                steps: JSON.stringify(roadmapData.steps)
            }).returning('*');

            // Track user's connection to this roadmap
            await db('user_progress').insert({
                user_id: user.id,
                path_id: savedRoadmap.id,
                completed_steps: '[]'
            });

            res.json(savedRoadmap);
        } catch (error) {
            console.error('Roadmap Generation Error:', error);
            res.status(500).json({ error: 'Failed to generate dynamic roadmap' });
        }
    }

    static async listUserRoadmaps(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user!;
            const roadmaps = await db('learning_paths')
                .join('user_progress', 'learning_paths.id', 'user_progress.path_id')
                .where('user_progress.user_id', user.id)
                .select('learning_paths.*', 'user_progress.completed_steps');

            res.json(roadmaps);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch roadmaps' });
        }
    }
}
