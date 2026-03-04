import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import InterviewService from '../services/InterviewService';

export const startInterview = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { topic, difficulty, numQuestions, role, learner_level } = req.body;
        const result = await InterviewService.startInterview(req.user!.id, {
            topic: topic || 'General',
            difficulty: difficulty || 'Medium',
            numQuestions: numQuestions || 5,
            role: role || 'Learner',
            learner_level: learner_level || 'Professional',
        });
        res.status(201).json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const answerQuestion = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { interviewId, questionId, answerText } = req.body;
        const result = await InterviewService.answerQuestion(interviewId, questionId, answerText);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const result = await InterviewService.getReport(id);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const listSessions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sessions = await InterviewService.listSessions(req.user!.id);
        res.json(sessions);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
