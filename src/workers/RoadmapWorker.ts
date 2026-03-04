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
            
            For EACH day, provide:
            1. "day_number": Integer.
            2. "title": Day topic.
            3. "description": Brief day overview.
            4. "tasks": EXACTLY 3 tasks (one theory, one mcq, one coding). Each task MUST be an object formatted as: { "type": "theory" | "mcq" | "coding", "title": "...", "content": "..." }. Ensure the "tasks" array is always present.

            Respond with a JSON array of ${endDay - startDay + 1} objects.`;

            const systemPrompt = `You are an elite technical mentor. Return JSON array ONLY. Each item: { "day_number": number, "title": string, "description": string, "tasks": Array }`;

            let batch = await ai.generate(prompt, systemPrompt, true, userId);

            // Handle case where AI returns string even in JSON mode (e.g., markdown wrapping)
            if (typeof batch === 'string') {
                try {
                    const jsonMatch = batch.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        batch = JSON.parse(jsonMatch[0]);
                    } else {
                        const objMatch = batch.match(/\{[\s\S]*\}/);
                        if (objMatch) {
                            batch = JSON.parse(objMatch[0]);
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse AI string output');
                }
            }

            // Sometimes Ollama JSON mode returns an object wrapping the array like { "days": [...] }
            if (batch && !Array.isArray(batch) && typeof batch === 'object') {
                let foundArray = false;
                for (const key of Object.keys(batch)) {
                    if (Array.isArray(batch[key])) {
                        batch = batch[key];
                        foundArray = true;
                        break;
                    }
                }

                // If it's just a single returned day object rather than an array of days
                if (!foundArray && batch.title && batch.tasks) {
                    batch = [batch];
                }
            }

            if (!Array.isArray(batch)) {
                console.error('Invalid AI Output:', batch);
                throw new Error(`AI returned invalid format for days ${startDay}-${endDay}`);
            }

            // 3. Insert steps for this batch
            await db('workspace_steps').insert(
                batch.map((s: any, idx: number) => ({
                    workspace_id: workspaceId,
                    title: s.title,
                    description: s.description,
                    day_number: s.day_number || (generatedDays + idx + 1), // dynamically use tracked days
                    tasks: JSON.stringify(s.tasks || []),
                    estimated_days: 1,
                    order_index: generatedDays + idx
                }))
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
