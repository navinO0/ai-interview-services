import { createClient } from 'redis';
import config from './env';

const redisClient = createClient({
    url: config.redis.url
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// For the health check, we don't necessarily need to keep it connected here,
// but we will export it so it can be used for session storage or other features later.
export default redisClient;
