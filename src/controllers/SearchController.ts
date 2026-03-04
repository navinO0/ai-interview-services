import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import SearchService from '../services/SearchService';
import config from '../config/env';

export class SearchController {
    static async search(req: AuthenticatedRequest, res: Response) {
        try {
            const { query } = req.query;

            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'Search query is required' });
            }

            const results = await SearchService.search(query);
            res.json(results);
        } catch (error) {
            console.error('Search Controller Error:', error);
            res.status(500).json({ error: 'Failed to perform search' });
        }
    }

    static async getSummary(req: AuthenticatedRequest, res: Response) {
        try {
            const { query } = req.query;

            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'Search query is required' });
            }

            const summary = await SearchService.getSearchSummary(query);
            res.json({ summary });
        } catch (error) {
            console.error('Search Controller Error:', error);
            res.status(500).json({ error: 'Failed to get search summary' });
        }
    }
}
