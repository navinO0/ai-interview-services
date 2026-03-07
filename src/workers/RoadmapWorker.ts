import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import db from '../config/db';
import ai from '../services/aiProviderFactory';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const roadmapWorker = new Worker('roadmap-generation', async (job: Job) => {
    const { workspaceId, title, goal, category, difficulty, learnerLevel, targetDays } = job.data;

    console.log(`[Worker] Processing roadmap for workspace: ${workspaceId} (${title})`);

    try {
        // 1. Update status to processing and fetch userId
        const [workspace] = await db('workspaces').where({ id: workspaceId }).update({
            status: 'processing',
            generation_progress: 0
        }).returning('*');

        const userId = workspace?.user_id;

        // 2. Incremental Generation (batches of 5 days)
        const batchSize = 5;
        const totalDays = targetDays || 10;
        let generatedDays = 0;

        while (generatedDays < totalDays) {
            const startDay = generatedDays + 1;
            const endDay = Math.min(generatedDays + batchSize, totalDays);

            console.log(`[Worker] Generating days ${startDay} to ${endDay} for ${workspaceId}`);

            const prompt = `Continue generating the DAILY learning roadmap for the topic: "${title}".
            Goal: "${goal}". Learner Level: ${learnerLevel}. Difficulty: ${difficulty}.
            
            Now generate details for DAYS ${startDay} to ${endDay} of the total ${totalDays} days.
            
            CRITICAL: For EACH day, provide:
            1. "day_number": Integer starting from ${startDay}.
            2. "title": Day topic.
            3. "description": 2-3 sentences explaining what will be learned.
            4. "tasks": EXACTLY 3 objects (theory, mcq, coding). 
               Each task schema: { "type": string, "title": string, "content": string }.
               Ensure "tasks" is NEVER empty.

            Respond with a JSON array.`;

            const systemPrompt = `You are an expert technical curriculum designer. Return a JSON array of objects. Every object must have "day_number", "title", "description", and "tasks".`;

            let batch = await ai.generate(prompt, systemPrompt, true, userId);

            // Handle case where AI returns string even in JSON mode
            if (typeof batch === 'string') {
                try {
                    const jsonMatch = batch.match(/\[[\s\S]*\]/);
                    batch = JSON.parse(jsonMatch ? jsonMatch[0] : batch);
                } catch (e) {
                    console.error('Failed to parse AI string output');
                }
            }

            // Standardize output format
            if (batch && !Array.isArray(batch) && typeof batch === 'object') {
                const possibleArray = Object.values(batch).find(val => Array.isArray(val));
                if (possibleArray) batch = possibleArray;
                else if (batch.title && batch.tasks) batch = [batch];
            }

            if (!Array.isArray(batch) || batch.length === 0) {
                console.error('Invalid or empty AI Output:', batch);
                throw new Error(`AI returned no valid days for ${startDay}-${endDay}. Try again with a different model or prompt.`);
            }

            // 3. Insert steps for this batch
            await db('workspace_steps').insert(
                batch.map((s: any, idx: number) => {
                    const dayTitle = s.title || `Day ${startDay + idx}`;
                    // Ensure tasks is NEVER empty and always has the correct structure (array of objects)
                    let rawTasks = s.tasks;
                    if (rawTasks && typeof rawTasks === 'object' && !Array.isArray(rawTasks)) {
                        rawTasks = Object.values(rawTasks); // Convert {t:..., m:..., c:...} to array
                    }

                    let finalTasks = (Array.isArray(rawTasks) && rawTasks.length > 0) ? rawTasks : [];

                    // Normalize each task to {type, title, content}
                    finalTasks = finalTasks.map((t: any, i: number) => {
                        const type = t.type || ['theory', 'mcq', 'coding'][i] || 'theory';
                        if (typeof t === 'string') {
                            return { type, title: t, content: t };
                        }
                        return {
                            type: t.type || type,
                            title: t.title || t.question || t.name || `Task ${i + 1}`,
                            content: t.content || t.description || t.text || dayTitle
                        };
                    });

                    // If still empty after mapping or if AI returned garbage, use defaults
                    if (finalTasks.length === 0) {
                        finalTasks = [
                            { type: 'theory', title: `Fundamentals of ${dayTitle}`, content: `Deep dive into the core concepts and architecture of ${dayTitle}.` },
                            { type: 'mcq', title: `${dayTitle} Knowledge Check`, content: `Test your understanding with a series of conceptual questions on ${dayTitle}.` },
                            { type: 'coding', title: `Hands-on ${dayTitle}`, content: `Build a practical implementation or small project focusing on ${dayTitle} features.` }
                        ];
                    }

                    return {
                        workspace_id: workspaceId,
                        title: dayTitle,
                        description: s.description || `Master the principles and practices of ${dayTitle}.`,
                        day_number: s.day_number || (startDay + idx),
                        tasks: JSON.stringify(finalTasks),
                        estimated_days: 1,
                        order_index: generatedDays + idx
                    };
                })
            );

            generatedDays += batch.length; // Use the actual number of days generated
            const progress = Math.round((generatedDays / totalDays) * 100);

            // 4. Update progress in DB
            await db('workspaces').where({ id: workspaceId }).update({
                generation_progress: progress
            });
        }

        // 5. Mark workspace as completed
        await db('workspaces').where({ id: workspaceId }).update({
            status: 'completed',
            generation_progress: 100
        });

        // 6. Cache the result for future reuse
        const fingerprint = `${title}-${difficulty}-${learnerLevel}`.toLowerCase().replace(/\s+/g, '-');
        const finalSteps = await db('workspace_steps').where({ workspace_id: workspaceId }).orderBy('order_index', 'asc');

        await db('cached_roadmaps').insert({
            topic_fingerprint: fingerprint,
            title,
            goal,
            category,
            difficulty,
            learner_level: learnerLevel,
            steps_structure: JSON.stringify(finalSteps)
        }).onConflict('topic_fingerprint').merge();

        console.log(`[Worker] Completed and cached roadmap for: ${fingerprint}`);

    } catch (error: any) {
        console.error(`[Worker] BUG in roadmap generation for ${workspaceId}:`, error);

        await db('workspaces').where({ id: workspaceId }).update({
            status: 'failed',
            error_log: error.message || 'Unknown error during generation'
        });

        throw error;
    }
}, {
    connection: connection as any,
    concurrency: 2
});

roadmapWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} permanently failed:`, err);
});
