import config from './config/env';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry before anything else
if (config.sentry.dsn) {
    Sentry.init({
        dsn: config.sentry.dsn,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, 
        profilesSampleRate: 1.0,
    });
}

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import passport from './config/passport';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const logger = pino();

const app = express();

if (config.trustProxy) {
    app.set('trust proxy', 1);
}

// Sentry request handler must be the first middleware on the app
if (config.sentry.dsn) {
    Sentry.setupExpressErrorHandler(app);
}

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Backend Interview Coach API',
            version: '1.0.0',
            description: 'API documentation for the AI Backend Interview Coach',
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rate Limiting
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

let limiterOptions: any = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
};

if (config.redis.enabled) {
    const redisClient = createClient({ url: config.redis.url });
    redisClient.connect().catch(err => logger.error({ err }, 'Redis connection failed'));
    limiterOptions.store = new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });
} else {
    logger.info('ℹ️  Redis is disabled. Rate limiting will use MemoryStore.');
}

const limiter = rateLimit(limiterOptions);

app.use('/api/', limiter);

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Session and Passport Middleware
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Request ID tracking
app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).id = uuidv4();
    next();
});

// --- Curl-format request logger ---
app.use((req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).id;
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Build curl parts
    const parts: string[] = [`curl -X ${req.method}`];

    // Add headers (skip noisy ones)
    const skipHeaders = new Set(['host', 'connection', 'accept-encoding', 'content-length']);
    for (const [key, value] of Object.entries(req.headers)) {
        if (!skipHeaders.has(key.toLowerCase()) && typeof value === 'string') {
            parts.push(`-H '${key}: ${value}'`);
        }
    }

    // Add body for methods that have one
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        parts.push(`-d '${JSON.stringify(req.body)}'`);
    }

    parts.push(`'${fullUrl}'`);
    const separator = ' \\\n  ';
    const curlCmd = parts.join(separator);

    logger.info({ reqId: id }, `Incoming Request [${id}] ${curlCmd}`);

    // Log response status on finish
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        logger[level]({ reqId: id, statusCode: res.statusCode, durationMs: duration },
            `↩️  Response [${id}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.send('<html><body><h1>Hello</h1></body></html>');
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import router from './routes';
app.use('/api', router);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const id = (req as any).id;
    const statusCode = err.statusCode || 500;
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    logger.error({
        reqId: id,
        method: req.method,
        url: fullUrl,
        statusCode,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
    }, `ERROR [${id}] ${req.method} ${req.originalUrl} | Status: ${statusCode} | ${err.message}`);

    res.status(statusCode).json({
        error: {
            message: err.message || 'Internal Server Error',
            id,
        },
    });
});

import { checkConnectivity } from './utils/healthCheck';
import db from './config/db';
import './workers/RoadmapWorker'; // Start the roadmap worker
import './workers/AIWorker'; // Start the AI task worker

const PORT = config.port;
let server: any;

if (config.env !== 'test') {
    server = app.listen(PORT, async () => {
        logger.info(`Backend service running on port ${PORT}`);
        logger.info(`--- Infrastructure Access (DNS / External) ---`);
        logger.info(`📜 API & Docs:      https://api.${config.domain} (or http://localhost:${PORT}/api-docs)`);
        
        if (config.redis.enabled) {
            logger.info(`🔵 Redis Insight:   ${config.redis.externalUrl} (or ${config.redis.insightUrl})`);
        }
        


        logger.info(`🦙 Ollama API:      ${config.ollama.externalUrl} (or ${config.ollama.url})`);

        if (config.sentry.dsn) {
            logger.info(`🚀 Sentry Dash:     ${config.sentry.dashboardUrl}`);
        }
        logger.info(`----------------------------------------------`);

        await checkConnectivity();
    });
}

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close(() => {
            logger.info('HTTP server closed.');
        });
    }

    try {
        await db.destroy();
        logger.info('Database connection closed.');
        process.exit(0);
    } catch (err) {
        logger.error({ err }, 'Error during database disconnection');
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
