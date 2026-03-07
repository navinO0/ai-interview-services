import dotenv from 'dotenv';
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    database: {
        url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/interview_coach',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'super-secret-dev-key',
        expiresIn: '24h',
    },
    googleClientID: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    ai: {
        provider: (process.env.AI_PROVIDER || 'ollama') as 'ollama' | 'claude' | 'ollama-cli' | 'openai' | 'gemini',
    },
    ollama: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.MODEL_NAME || 'phi3:mini',
        allowDirectAccess: process.env.ALLOW_DIRECT_AI === 'true',
    },
    claude: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:19092').split(','),
        clientId: 'interview-coach-api',
    },
    socket: {
        corsOrigin: process.env.CORS_ORIGIN || '*',
    },
    search: {
        enabled: process.env.ENABLE_WEB_SEARCH === 'true',
        tavilyApiKey: process.env.TAVILY_API_KEY || '',
    },
    logging: {
        logAiPrompts: process.env.LOG_AI_PROMPTS === 'true',
        logDbQueries: process.env.LOG_DB_QUERIES === 'true',
        debug: process.env.DEBUG === 'true',
    },
};

export default config;
