import { Request, Response } from 'express';
import PlaygroundService from '../services/PlaygroundService';
import { AuthenticatedRequest } from '../types/auth';

export class PlaygroundController {
    static async analyzeCode(req: AuthenticatedRequest, res: Response) {
        try {
            const { code, language } = req.body;
            if (!code || !language) {
                return res.status(400).json({ error: 'Code and language are required' });
            }

            const analysis = await PlaygroundService.analyzeCode(code, language, req.user!.id);
            res.json(analysis);
        } catch (error: any) {
            console.error('[PlaygroundController] Analysis Error:', error);
            res.status(500).json({ error: error.message || 'Failed to analyze code' });
        }
    }

    static async getSuggestions(req: Request, res: Response) {
        try {
            const { code, language } = req.body;
            const suggestions = await PlaygroundService.getSuggestions(code, language);
            res.json({ suggestions });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get suggestions' });
        }
    }
}
