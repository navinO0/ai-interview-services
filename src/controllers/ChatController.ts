import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import db from '../config/db';
import ai from '../services/aiProviderFactory';
import SearchService from '../services/SearchService';
import config from '../config/env';

export class ChatController {
    static async getHistory(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user!;
            const messages = await db('chat_messages')
                .where({ user_id: user.id })
                .orderBy('created_at', 'asc');
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }

    static async sendMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user!;
            const { content, message } = req.body;
            const finalContent = content || message;

            if (!finalContent) {
                return res.status(400).json({ error: 'Content is required' });
            }

            // Detect if web search is needed based on the prompt
            const searchKeywords = ['latest', 'current', '2026', 'salary', 'trend', 'market', 'hiring', 'recent', 'today'];
            const needsSearch = searchKeywords.some(keyword => finalContent.toLowerCase().includes(keyword));

            let searchContext = '';
            if (needsSearch && config.search.enabled) {
                console.log(`🔍 ChatController: Web search triggered for query: "${finalContent}"`);
                searchContext = await SearchService.getSearchSummary(finalContent);
            }

            // Save user message
            await db('chat_messages').insert({
                user_id: user.id,
                role: 'user',
                content: finalContent
            });

            // Get context for AI
            const history = await db('chat_messages')
                .where({ user_id: user.id })
                .orderBy('created_at', 'desc')
                .limit(5);

            let prompt = `You are a technical interview tutor. Help the user with their questions. 
            Keep it brief, technical and encouraging.`;

            if (searchContext) {
                prompt += `\n\nUSE THE FOLLOWING REAL-TIME WEB SEARCH RESULTS TO INFORM YOUR ANSWER:\n${searchContext}\n\n`;
            }

            prompt += `\nUser: ${finalContent}`;

            const aiResponse = await ai.generate(prompt, undefined, false, user.id);

            // Save AI response
            const savedResponse = await db('chat_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: aiResponse
            }).returning('*');

            res.json(savedResponse[0]);
        } catch (error) {
            console.error('Chat Controller Error:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    }
}
