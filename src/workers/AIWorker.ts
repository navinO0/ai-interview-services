import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import ai from '../services/aiProviderFactory';
import db from '../config/db';
import dotenv from 'dotenv';
import pino from 'pino';

const logger = pino();
dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const aiWorker = new Worker('ai-tasks', async (job: Job) => {
    const { type, data, userId } = job.data;
    logger.info({ jobId: job.id, type, userId }, 'Processing AI task');

    try {
        switch (type) {
            case 'evaluate-answer': {
                const { questionText, answerText, level } = data;
                const { getEvaluationPrompt, EVALUATION_SYSTEM_PROMPT } = await import('../prompts/interview');
                const prompt = getEvaluationPrompt(questionText, answerText, level);
                const result = await ai.generate(prompt, EVALUATION_SYSTEM_PROMPT, true, userId);
                return result;
            }
            case 'generate-suggestion': {
                const { questionText, topic, level } = data;
                const { getSuggestedAnswerPrompt, SUGGESTED_ANSWER_SYSTEM_PROMPT } = await import('../prompts/interview');
                const prompt = getSuggestedAnswerPrompt(questionText, topic, level);
                const result = await ai.generate(prompt, SUGGESTED_ANSWER_SYSTEM_PROMPT, false, userId);
                return result;
            }
            // Add more task types here
            default:
                throw new Error(`Unknown AI task type: ${type}`);
        }
    } catch (error) {
        logger.error({ error, jobId: job.id, type }, 'AI task failed');
        throw error;
    }
}, {
    connection: connection as any,
    concurrency: 5 // Higher concurrency for general tasks
});

aiWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'AI Job failed permanently');
});
