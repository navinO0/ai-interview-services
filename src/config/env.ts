import dotenv from 'dotenv';
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    domain: process.env.DOMAIN || 'navin.lol',
    trustProxy: process.env.TRUST_PROXY !== 'false', // Default to true for proxy support
    frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((o) => o.trim()), // CRITICAL: Used for CORS allowed origin
    database: {
        url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/interview_coach',
    },
    jwt: {
        // WARNING: Change this secret in production!
        secret: process.env.JWT_SECRET || 'super-secret-dev-key', 
        expiresIn: '24h',
    },
    // WARNING: Change this secret in production!
    sessionSecret: process.env.SESSION_SECRET || 'session-secret-dev-key', 
    googleClientID: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    ai: {
        provider: (process.env.AI_PROVIDER || 'ollama') as 'ollama' | 'claude' | 'ollama-cli' | 'openai' | 'gemini',
    },
    ollama: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.MODEL_NAME || 'phi3:mini',
        allowDirectAccess: process.env.ALLOW_DIRECT_AI === 'true',
        externalUrl: process.env.OLLAMA_EXTERNAL_URL || 'https://ollama.navin.lol',
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
        enabled: process.env.ENABLE_REDIS !== 'false', // Default to true
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        insightUrl: process.env.REDIS_INSIGHT_URL || 'http://localhost:5540',
        externalUrl: process.env.REDIS_INSIGHT_EXTERNAL_URL || 'https://insight.navin.lol',
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
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
        dashboardUrl: process.env.SENTRY_DASHBOARD_URL || 'https://sentry.io/organizations/my-org/projects/my-project/',
    },
};

export default config;
