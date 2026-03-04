import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import db from '../config/db';
import OllamaProvider from '../services/OllamaService';

const ollama = new OllamaProvider();

export class AISettingsController {
    static async getSettings(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            let settings = await db('user_ai_settings').where({ user_id: userId }).first();

            if (!settings) {
                // Return defaults if not set
                return res.json({
                    provider: 'ollama',
                    model_name: 'llama3',
                    api_key: '',
                    use_custom_settings: false,
                    setup_completed: false
                });
            }

            res.json(settings);
        } catch (error) {
            console.error('Get AISettings Error:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    static async saveSettings(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user.id;
            const { provider, model_name, api_key, use_custom_settings } = req.body;

            const existing = await db('user_ai_settings').where({ user_id: userId }).first();

            if (existing) {
                await db('user_ai_settings')
                    .where({ user_id: userId })
                    .update({
                        provider,
                        model_name,
                        api_key,
                        use_custom_settings: !!use_custom_settings,
                        setup_completed: true,
                        updated_at: db.fn.now()
                    });
            } else {
                await db('user_ai_settings').insert({
                    user_id: userId,
                    provider,
                    model_name,
                    api_key,
                    use_custom_settings: !!use_custom_settings,
                    setup_completed: true
                });
            }

            res.json({ success: true, message: 'Settings saved successfully' });
        } catch (error) {
            console.error('Save AISettings Error:', error);
            res.status(500).json({ error: 'Failed to save settings' });
        }
    }

    static async listLocalModels(req: AuthenticatedRequest, res: Response) {
        try {
            const models = await ollama.listModels();
            res.json(models);
        } catch (error) {
            res.status(500).json({ error: 'Failed to list local models' });
        }
    }

    static async pullModel(req: AuthenticatedRequest, res: Response) {
        try {
            const modelName = req.body.modelName || req.query.modelName;
            if (!modelName) {
                return res.status(400).json({ error: 'modelName is required' });
            }
            const result = await ollama.pullModel(modelName as string);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            result.data.on('data', (chunk: Buffer) => {
                res.write(`data: ${chunk.toString()}\n\n`);
            });

            result.data.on('end', () => {
                res.end();
            });

            result.data.on('error', (err: any) => {
                res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                res.end();
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
