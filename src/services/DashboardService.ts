import db from '../config/db';
import OllamaProvider from './OllamaService';
import { connection as redis } from './QueueService';
import { DASHBOARD_SYSTEM_PROMPT, JOKE_PROMPT, OFFICE_POLITICS_PROMPT, DEV_EXCELLENCE_PROMPT } from '../prompts/dashboard';

const ollama = new OllamaProvider();
const CACHE_TTL = 3600; // 1 hour

class DashboardService {
    async getJoke(userId?: string) {
        const cacheKey = `dashboard:joke:${userId || 'global'}`;

        try {
            // 1. Try Cache
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);

            // 2. Generate with Ollama
            const result = await ollama.generate(JOKE_PROMPT, DASHBOARD_SYSTEM_PROMPT, true);
            const jokeText = result.joke || "Why did the developer go broke? Because he used up all his cache.";

            const [newJoke] = await db('tech_jokes').insert({ content: jokeText }).returning('*');

            // 3. Cache it
            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(newJoke));

            return newJoke;
        } catch (error) {
            console.error('AI Joke Generation Error:', error);
            const jokes = await db('tech_jokes').select('*').limit(50);
            if (jokes.length > 0) return jokes[Math.floor(Math.random() * jokes.length)];
            return { content: "Internal Server Error: My sense of humor is currently being refactored." };
        }
    }

    async getOfficePoliticsTips(userId?: string) {
        const cacheKey = `dashboard:politics:${userId || 'global'}`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);

            const result = await ollama.generate(OFFICE_POLITICS_PROMPT, DASHBOARD_SYSTEM_PROMPT, true);
            const tipsArray = Array.isArray(result) ? result : [result];

            const toInsert = tipsArray.map((t: any) => ({
                content: t.content || "Keep your head down and your commits clean.",
                category: t.category || "Survival"
            }));

            const inserted = await db('office_politics_tips').insert(toInsert).returning('*');

            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(inserted));

            return inserted;
        } catch (error) {
            console.error('AI Politics Tips Generation Error:', error);
            const tips = await db('office_politics_tips').select('*').limit(20);
            if (tips.length > 0) return tips.sort(() => 0.5 - Math.random()).slice(0, 3);
            return [{ content: "Survival tip #1: Don't trust the AI when it's failing to generate tips.", category: "Meta" }];
        }
    }

    async getDevExcellenceTips(userId?: string) {
        const cacheKey = `dashboard:excellence:${userId || 'global'}`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);

            const result = await ollama.generate(DEV_EXCELLENCE_PROMPT, DASHBOARD_SYSTEM_PROMPT, true);
            const tipsArray = Array.isArray(result) ? result : [result];

            const toInsert = tipsArray.map((t: any) => ({
                content: t.content || "Write clean code.",
                type: (t.type || "DO").toUpperCase()
            }));

            // Insert and get full objects with IDs
            const inserted = await db('dev_excellence_tips').insert(toInsert).returning('*');

            const dos = inserted.filter((t: any) => t.type === 'DO').slice(0, 2);
            const avoids = inserted.filter((t: any) => t.type === 'AVOID').slice(0, 2);

            if (avoids.length === 0) {
                avoids.push({ content: "Avoid: Over-engineering simple solutions.", type: "AVOID" });
            }

            const finalTips = [...dos, ...avoids];
            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(finalTips));

            return finalTips;
        } catch (error) {
            console.error('AI Excellence Tips Generation Error:', error);
            let tips = await db('dev_excellence_tips').select('*').limit(50);
            if (tips.length === 0) {
                return [
                    { content: "Do: Check your logs.", type: "DO" },
                    { content: "Avoid: Hardcoding credentials.", type: "AVOID" }
                ];
            }
            const dos = tips.filter((t: any) => t.type?.toUpperCase() === 'DO').sort(() => 0.5 - Math.random()).slice(0, 2);
            const avoids = tips.filter((t: any) => t.type?.toUpperCase() === 'AVOID').sort(() => 0.5 - Math.random()).slice(0, 2);
            return [...dos, ...avoids];
        }
    }
}

export default new DashboardService();
