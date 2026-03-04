import config from './config/env';
import express, { Request, Response, NextFunction } from 'express';
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Session and Passport Middleware
app.use(session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false
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

const PORT = config.port;
let server: any;

if (config.env !== 'test') {
    server = app.listen(PORT, async () => {
        logger.info(`Backend service running on port ${PORT}`);
        logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
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
