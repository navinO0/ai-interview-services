import dotenv from 'dotenv';
dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000', // CRITICAL: Used for CORS allowed origin
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
    },
    kafka: {
        enabled: process.env.ENABLE_KAFKA === 'true',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:19092').split(','),
        clientId: 'interview-coach-api',
        consoleUrl: process.env.KAFKA_CONSOLE_URL || 'http://localhost:8080',
    },
    socket: {
        enabled: process.env.ENABLE_SOCKET === 'true',
        // Parse comma-separated origins into array so Socket.io accepts all of them.
        // e.g. "http://localhost:3000,https://navin.lol,https://app.navin.lol"
        corsOrigin: (process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000')
            .split(',')
            .map((o) => o.trim()),
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
