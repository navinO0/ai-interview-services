import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const roadmapQueue = new Queue('roadmap-generation', {
    connection: connection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
});

export const roadmapQueueEvents = new QueueEvents('roadmap-generation', { connection: connection as any });

// Handle global queue errors
connection.on('error', (err) => {
    console.error('Redis Connection Error:', err);
});
