import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import ai from '../services/aiProviderFactory';
import config from '../config/env';

export class AIController {
    static async streamExplain(req: AuthenticatedRequest, res: Response) {
        try {
            const { code, language } = req.body;
            if (!code) return res.status(400).json({ error: 'Code is required' });

            const prompt = `Explain this ${language} code for a technical interview. Keep it concise, focused on logic and performance.\n\nCode:\n${code}`;
            const system = 'You are an expert technical interviewer and clean code advocate.';

            const ollamaRes = await ai.generateStream(prompt, system);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            ollamaRes.data.on('data', (chunk: Buffer) => {
                res.write(`data: ${chunk.toString()}\n\n`);
            });

            ollamaRes.data.on('end', () => {
                res.write('event: end\ndata: [DONE]\n\n');
                res.end();
            });

            ollamaRes.data.on('error', (err: Error) => {
                console.error('Ollama Stream Data Error:', err);
                res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
                res.end();
            });

        } catch (error) {
            console.error('AI Explain Stream Error:', error);
            res.status(500).json({ error: 'Failed to initialize AI explanation stream' });
        }
    }

    static async streamChallenge(req: AuthenticatedRequest, res: Response) {
        try {
            const { difficulty, topic } = req.body; // topic is moduleId: mcq, debug, coding

            let prompt = '';
            let system = 'You are an expert technical interviewer.';

            if (topic === 'mcq') {
                prompt = `Generate a ${difficulty} difficulty multiple choice question about backend engineering or computer science. Provide the question, 4 options, and the correct answer. Format it clearly.`;
                system = 'You are an expert in computer science theory and backend architecture.';
            } else if (topic === 'debug') {
                prompt = `Provide a ${difficulty} difficulty code snippet with a subtle bug. Explain what the code is supposed to do and ask the user to find and fix the bug.`;
                system = 'You are an expert debugger and clean code advocate.';
            } else {
                prompt = `Generate a ${difficulty} difficulty coding challenge. Provide a problem description, constraints, and starter code for the user to implement.`;
            }

            const ollamaRes = await ai.generateStream(prompt, system);

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            ollamaRes.data.on('data', (chunk: Buffer) => {
                res.write(`data: ${chunk.toString()}\n\n`);
            });

            ollamaRes.data.on('end', () => {
                res.write('event: end\ndata: [DONE]\n\n');
                res.end();
            });

        } catch (error) {
            console.error('AI Challenge Stream Error:', error);
            res.status(500).json({ error: 'Failed to initialize AI challenge stream' });
        }
    }

    static async directProxy(req: AuthenticatedRequest, res: Response) {
        if (!config.ollama.allowDirectAccess) {
            return res.status(403).json({ error: 'Direct AI access is disabled in server configuration.' });
        }

        try {
            // Forward everything in req.body to OllamaService.generateStream
            // We use generateStream because it's a flexible way to handle both streaming and non-streaming prompts
            // but for a true "direct" proxy, we might want to just call axios directly.
            // Let's call OllamaService.generateStream but pass the prompt and system from body if provided,
            // or better, just provide a raw proxy method in OllamaService.

            const { prompt, system, stream } = req.body;
            if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

            const ollamaRes = await ai.generateStream(prompt, system || 'You are a helpful assistant.');

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            ollamaRes.data.on('data', (chunk: Buffer) => {
                res.write(`data: ${chunk.toString()}\n\n`);
            });

            ollamaRes.data.on('end', () => {
                res.write('event: end\ndata: [DONE]\n\n');
                res.end();
            });

            ollamaRes.data.on('error', (err: Error) => {
                console.error('Ollama Direct Proxy Stream Error:', err);
                res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
                res.end();
            });

        } catch (error) {
            console.error('AI Direct Proxy Error:', error);
            res.status(500).json({ error: 'Failed to proxy request to Ollama' });
        }
    }
}
