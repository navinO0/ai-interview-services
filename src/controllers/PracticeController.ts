import { Request, Response } from 'express';
import db from '../config/db';
import PracticeService from '../services/PracticeService';
import { AuthenticatedRequest } from '../types/auth';

export class PracticeController {
    static async getChallenges(req: Request, res: Response) {
        try {
            const { category, type, difficulty, learner_level } = req.query;
            if (!category || !type) {
                return res.status(400).json({ error: 'Category and type are required' });
            }

            const count = parseInt(req.query.count as string);
            if (isNaN(count) || count <= 0) {
                return res.status(400).json({ error: 'Question count must be a positive number greater than 0' });
            }
            const challenges = await PracticeService.getOrGenerateChallenges(
                category as string,
                type as string,
                (difficulty as string) || 'Medium',
                count,
                (learner_level as string) || 'Professional',
                (req as any).user?.id
            );

            res.json(challenges);
        } catch (error) {
            console.error('[PracticeController] Error:', error);
            res.status(500).json({ error: 'Failed to fetch challenges' });
        }
    }

    static async getAdaptiveChallenge(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { category, difficulty, learner_level, session_history } = req.body;

            if (!category) {
                return res.status(400).json({ error: 'Category is required' });
            }

            const challenge = await PracticeService.generateSingleAdaptiveMCQ(
                category as string,
                (difficulty as string) || 'Medium',
                (learner_level as string) || 'Professional',
                req.user!.id,
                (session_history as any[]) || []
            );

            res.json(challenge);
        } catch (error: any) {
            console.error('[PracticeController] Adaptive Error:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch adaptive challenge' });
        }
    }

    static async submitSolution(req: AuthenticatedRequest, res: Response) {
        try {
            const { questionId, solution } = req.body;
            const question = await db('questions').where({ id: questionId }).first();

            if (!question) {
                return res.status(404).json({ error: 'Question not found' });
            }

            if (question.challenge_type === 'MCQ') {
                // Persist attempt and get explanation
                const userId = (req as any).user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' });
                }
                const result = await PracticeService.persistMcqAttempt(userId, questionId, solution);
                return res.json({
                    success: result.isCorrect,
                    message: result.isCorrect ? 'Correct! Well done.' : 'Incorrect – here\'s the explanation:',
                    isCorrect: result.isCorrect,
                    correctOption: result.correctOption,
                    explanation: result.explanation,
                    feedback: result.isCorrect
                        ? `✓ Correct! ${result.explanation}`
                        : `✗ The correct answer is: "${result.correctOption}". ${result.explanation}`,
                });
            } else {
                // For CODING – AI evaluation
                const userId = (req as any).user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' });
                }
                const result = await PracticeService.verifyCodingSolution(questionId, solution, req.body.language || 'typescript', userId);
                return res.json({
                    success: result.isCorrect,
                    message: result.isCorrect ? 'Great job! Your solution handles the edge cases well.' : 'Not quite right. Keep investigating.',
                    isCorrect: result.isCorrect,
                    feedback: result.feedback,
                });
            }
        } catch (error) {
            console.error('Submit Solution Error:', error);
            res.status(500).json({ error: 'Failed to submit solution' });
        }
    }

    static async getLearningPaths(req: Request, res: Response) {
        try {
            const paths = await db('learning_paths').select('*');
            res.json(paths);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch learning paths' });
        }
    }

    static async getMcqHistory(req: AuthenticatedRequest, res: Response) {
        try {
            const history = await PracticeService.getMcqHistory(req.user!.id);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch MCQ history' });
        }
    }

    static async getDsaHistory(req: AuthenticatedRequest, res: Response) {
        try {
            const history = await PracticeService.getDsaHistory(req.user!.id);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch DSA history' });
        }
    }

    static async runCode(req: AuthenticatedRequest, res: Response) {
        try {
            const { code, language } = req.body;
            if (!code || !language) return res.status(400).json({ error: 'Code and language are required' });

            const compiler = require('compile-run');
            const langMap: Record<string, any> = {
                'typescript': compiler.node,
                'javascript': compiler.node,
                'python': compiler.python,
                'java': compiler.java,
                'c++': compiler.cpp,
                'go': compiler.go || compiler.c, // fallback if needed
            };

            const runner = langMap[language.toLowerCase()];
            if (!runner) return res.status(400).json({ error: `Unsupported language for execution: ${language}` });

            const result = await runner.runSource(code);

            res.json({
                run: {
                    stdout: result.stdout,
                    stderr: result.stderr
                },
                message: result.errorType ? result.errorType : undefined
            });
        } catch (error) {
            console.error('Code execution error:', error);
            res.status(500).json({ error: 'Execution failed on server' });
        }
    }
}
