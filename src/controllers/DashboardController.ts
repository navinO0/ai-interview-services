import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import DashboardService from '../services/DashboardService';

export class DashboardController {
    static async getDashboardContent(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id;

            const [joke, officeTips, excellenceTips] = await Promise.all([
                DashboardService.getJoke(userId),
                DashboardService.getOfficePoliticsTips(userId),
                DashboardService.getDevExcellenceTips(userId)
            ]);

            res.json({
                joke,
                politicsTips: officeTips,
                excellenceTips: excellenceTips
            });
        } catch (error) {
            console.error('Dashboard Content Controller Error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard content' });
        }
    }
}
