import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import TopicService from '../services/TopicService';
import db from '../config/db';
import ai from '../services/aiProviderFactory';

export class TopicController {
    static async explainTopic(req: Request, res: Response) {
        try {
            const { topic } = req.query;
            if (!topic || typeof topic !== 'string') {
                return res.status(400).json({ error: 'Topic parameter is required' });
            }
            const explanation = await TopicService.explainTopic(topic);
            res.json(explanation);
        } catch (error) {
            console.error('Explain Topic Controller Error:', error);
            res.status(500).json({ error: 'Failed to generate topic explanation' });
        }
    }

    static async getStep(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const step = await db('workspace_steps')
                .where({ 'workspace_steps.id': id })
                .leftJoin('workspaces', 'workspace_steps.workspace_id', 'workspaces.id')
                .select(
                    'workspace_steps.*',
                    'workspaces.title as workspace_title',
                    'workspaces.goal as workspace_goal',
                    'workspaces.difficulty as workspace_difficulty',
                    'workspaces.category as workspace_category',
                    'workspaces.notes as workspace_notes',
                    'workspaces.id as workspace_id',
                    'workspaces.learner_level as workspace_learner_level',
                )
                .first();

            if (!step) return res.status(404).json({ error: 'Step not found' });

            // If no rich content, generate it via AI
            if (!step.content || step.content.trim() === '') {
                const prompt = `Create comprehensive structured learning content in Markdown format for the topic:
                Title: "${step.title}"
                Description: "${step.description}"
                Workspace Goal: "${step.workspace_goal}"
                Difficulty: "${step.workspace_difficulty}"
                Learner Level: "${step.workspace_learner_level || 'Professional'}"
                
                Structure the content with:
                ## Overview
                ## Key Concepts
                ## Real-World Use Cases
                ## Examples
                ## Common Pitfalls
                ## Summary
                
                Make it educational, clear, and appropriate for the difficulty level. Be sure to include practical use cases.
                Return only the markdown content.`;

                const content = await ai.generate(prompt, 'You are an expert educator. Generate well-structured, educational markdown content.', false);
                const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

                // Cache the content
                await db('workspace_steps').where({ id }).update({ description: step.description || '', content: contentStr });
                step.content = contentStr;
            }

            res.json(step);
        } catch (error) {
            console.error('GetStep Error:', error);
            res.status(500).json({ error: 'Failed to fetch topic step' });
        }
    }

    static async chatWithTopic(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const { message } = req.body;

            if (!message) return res.status(400).json({ error: 'Message is required' });

            const step = await db('workspace_steps')
                .where({ 'workspace_steps.id': id })
                .leftJoin('workspaces', 'workspace_steps.workspace_id', 'workspaces.id')
                .select('workspace_steps.title', 'workspace_steps.description', 'workspace_steps.content', 'workspaces.goal', 'workspaces.difficulty', 'workspaces.learner_level')
                .first();

            if (!step) return res.status(404).json({ error: 'Step not found' });

            const systemPrompt = `You are a knowledgeable tutor helping a student learn: "${step.title}".
Context about this topic:
${step.content || step.description || ''}
Learning Goal: ${step.goal || 'Master this topic'}
Difficulty Level: ${step.difficulty || 'Medium'}
Learner Level: ${step.learner_level || 'Professional'}

When answering:
- If the question is simple/factual: give a precise, direct answer (2-4 sentences).
- If the student wants deeper explanation: provide detailed, structured markdown with examples.
- Be encouraging and educational.`;

            // Check if streaming is requested
            const acceptsStream = req.headers.accept === 'text/event-stream';

            if (acceptsStream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const stream = await ai.generateStream(message, systemPrompt);
                stream.data.on('data', (chunk: Buffer) => {
                    const lines = chunk.toString().split('\n').filter(l => l.trim());
                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            res.write(`data: ${JSON.stringify({ token: parsed.response, done: parsed.done })}\n\n`);
                        } catch (_) { }
                    }
                });
                stream.data.on('end', () => res.end());
                stream.data.on('error', () => res.end());
            } else {
                const response = await ai.generate(message, systemPrompt, false);
                res.json({ response: typeof response === 'string' ? response : JSON.stringify(response) });
            }
        } catch (error) {
            console.error('TopicChat Error:', error);
            res.status(500).json({ error: 'Failed to process chat message' });
        }
    }
}
