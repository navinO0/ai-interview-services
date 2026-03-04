import axios from 'axios';
import db from '../config/db';
import redisClient from '../config/redis';
import config from '../config/env';
import pino from 'pino';

const logger = pino();

import OllamaProvider from '../services/OllamaService';

const ollamaProvider = new OllamaProvider();

async function ensureModelExists() {
    const targetModel = config.ollama.model;
    const models = await ollamaProvider.listModels();

    if (models.includes(targetModel) || models.includes(`${targetModel}:latest`)) {
        logger.info(`✅ Ollama: Model ${targetModel} is already installed`);
        return;
    }

    logger.warn(`⚠️ Ollama: Model ${targetModel} not found. Starting automatic pull...`);

    try {
        const streamRes: any = await ollamaProvider.pullModel(targetModel);

        return new Promise((resolve, reject) => {
            streamRes.data.on('data', (chunk: Buffer) => {
                try {
                    const lines = chunk.toString().split('\n').filter(l => l.trim());
                    for (const line of lines) {
                        const status = JSON.parse(line);
                        if (status.status) {
                            // Only log significant status changes to avoid spamming
                            if (status.status.includes('pulling') || status.status.includes('verifying') || status.status.includes('success')) {
                                logger.info(`🤖 Ollama Pull: ${status.status} ${status.total ? `(${Math.round((status.completed / status.total) * 100)}%)` : ''}`);
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parsing errors for small/partial chunks
                }
            });

            streamRes.data.on('end', () => {
                logger.info(`✅ Ollama: Successfully pulled model ${targetModel}`);
                resolve(true);
            });

            streamRes.data.on('error', (err: any) => {
                logger.error(`❌ Ollama: Pull failed - ${err.message}`);
                reject(err);
            });
        });
    } catch (error: any) {
        logger.error(`❌ Ollama: Failed to initiate model pull - ${error.message}`);
    }
}

export async function checkConnectivity() {
    logger.info('--- Infrastructure Connection Status ---');

    // 1. PostgreSQL
    try {
        await db.raw('SELECT 1');
        logger.info('✅ PostgreSQL: Connected');
    } catch (error: any) {
        logger.error(`❌ PostgreSQL: Connection Error (${error.message})`);
    }

    // 2. Redis
    try {
        await redisClient.connect();
        const response = await redisClient.ping();
        if (response === 'PONG') {
            logger.info('✅ Redis: Connected');
        } else {
            logger.warn(`⚠️ Redis: Unexpected PING response (${response})`);
        }
    } catch (error: any) {
        logger.error(`❌ Redis: Connection Error (${error.message})`);
    } finally {
        try {
            if (redisClient.isOpen) {
                await redisClient.disconnect();
            }
        } catch (e) { }
    }

    // 3. AI Provider Smoke Test
    const provider = config.ai.provider;
    try {
        if (provider === 'ollama') {
            const response = await axios.get(`${config.ollama.url}/api/tags`, { timeout: 5000 });
            if (response.status === 200) {
                logger.info('✅ Ollama: Service Connected');
                await ensureModelExists();
            } else {
                logger.warn(`⚠️ Ollama: Service reachable but returned status ${response.status}`);
            }
        }

        // Perform a minimal smoke test for ANY provider
        const aiFactory = (await import('../services/aiProviderFactory')).default;
        const testResponse = await aiFactory.generate('Say "connected"', 'You are a health check system. Respond with only the word "connected".');

        const responseText = (typeof testResponse === 'string' ? testResponse : (testResponse?.response || '')).toLowerCase();

        if (responseText.includes('connected')) {
            logger.info(`✅ AI Provider (${provider}): Smoke test passed`);
        } else {
            logger.warn(`⚠️ AI Provider (${provider}): Smoke test returned unexpected response: ${responseText}`);
        }
    } catch (error: any) {
        logger.error(`❌ AI Provider (${provider}): Connection Error (${error.message})`);
    }

    logger.info('---------------------------------------');
}
