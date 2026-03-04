import db from '../config/db';
import ai from './aiProviderFactory';
import { DASHBOARD_SYSTEM_PROMPT, JOKE_PROMPT, OFFICE_POLITICS_PROMPT, DEV_EXCELLENCE_PROMPT } from '../prompts/dashboard';

class DashboardService {
    async getJoke(userId?: string) {
        try {
            const result = await ai.generate(JOKE_PROMPT, DASHBOARD_SYSTEM_PROMPT, true, userId);
            const jokeText = result.joke || "Why did the developer go broke? Because he used up all his cache.";

            const [newJoke] = await db('tech_jokes').insert({ content: jokeText }).returning('*');
            return newJoke;
        } catch (error) {
            console.error('AI Joke Generation Error:', error);
            // Fallback to random joke from DB
            const jokes = await db('tech_jokes').select('*');
            if (jokes.length > 0) return jokes[Math.floor(Math.random() * jokes.length)];
            return { content: "Internal Server Error: My sense of humor is currently being refactored." };
        }
    }

    async getOfficePoliticsTips(userId?: string) {
        try {
            const result = await ai.generate(OFFICE_POLITICS_PROMPT, DASHBOARD_SYSTEM_PROMPT, true, userId);
            const tipsArray = Array.isArray(result) ? result : [result];

            const toInsert = tipsArray.map((t: any) => ({
                content: t.content || "Keep your head down and your commits clean.",
                category: t.category || "Survival"
            }));

            const inserted = await db('office_politics_tips').insert(toInsert).returning('*');
            return inserted;
        } catch (error) {
            console.error('AI Politics Tips Generation Error:', error);
            // Fallback to DB
            const tips = await db('office_politics_tips').select('*');
            if (tips.length > 0) return tips.sort(() => 0.5 - Math.random()).slice(0, 3);
            return [{ content: "Survival tip #1: Don't trust the AI when it's failing to generate tips.", category: "Meta" }];
        }
    }

    async getDevExcellenceTips(userId?: string) {
        try {
            const result = await ai.generate(DEV_EXCELLENCE_PROMPT, DASHBOARD_SYSTEM_PROMPT, true, userId);
            const tipsArray = Array.isArray(result) ? result : [result];

            const toInsert = tipsArray.map((t: any) => ({
                content: t.content || "Write clean code.",
                type: (t.type || "DO").toUpperCase()
            }));

            await db('dev_excellence_tips').insert(toInsert);

            const dos = toInsert.filter((t: any) => t.type === 'DO').slice(0, 2);
            const avoids = toInsert.filter((t: any) => t.type === 'AVOID').slice(0, 2);
            if (avoids.length === 0) avoids.push({ content: "Avoid: Over-engineering simple solutions.", type: "AVOID" });

            return [...dos, ...avoids];
        } catch (error) {
            console.error('AI Excellence Tips Generation Error:', error);
            let tips = await db('dev_excellence_tips').select('*');
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
