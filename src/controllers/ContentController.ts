import { Request, Response } from 'express';
import ContentService from '../services/ContentService';

export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const { topic } = req.query;
        if (!topic) return res.status(400).json({ error: 'Topic query parameter is required' });

        const result = await ContentService.getSuggestions(topic as string);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
