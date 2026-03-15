import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import config from '../config/env';
import pino from 'pino';

const logger = pino();

class SocketService {
    private io: Server | null = null;

    async init(httpServer: any) {
        if (!config.socket.enabled) {
            logger.info('Socket.io is disabled via configuration. Skipping initialization.');
            return;
        }

        this.io = new Server(httpServer, {
            cors: {
                origin: config.socket.corsOrigin,
                methods: ['GET', 'POST'],
            },
        });

        // Setup Redis Adapter for scaling (optional)
        if (config.redis.enabled) {
            const pubClient = createClient({ url: config.redis.url });
            const subClient = pubClient.duplicate();

            try {
                await Promise.all([pubClient.connect(), subClient.connect()]);
                this.io.adapter(createAdapter(pubClient, subClient));
                logger.info('Socket.io Redis adapter connected successfully');
            } catch (err) {
                logger.error({ err }, 'Failed to connect Socket.io Redis adapter');
                // Don't throw, let it fall back to memory adapter if Redis fails? 
                // Actually, if it's explicitly enabled, maybe we should throw.
                // But for resilience, we'll just log and continue.
            }
        } else {
            logger.info('ℹ️  Redis is disabled. Socket.io will use default Memory adapter.');
        }

        this.io.on('connection', (socket: Socket) => {
            const userId = socket.handshake.query.userId as string;
            const ip = socket.handshake.address;
            const userAgent = socket.handshake.headers['user-agent'];

            if (userId) {
                socket.join(`user:${userId}`);
                logger.info({
                    userId,
                    socketId: socket.id,
                    ip,
                    userAgent,
                    query: socket.handshake.query
                }, 'User joined socket session');
            } else {
                logger.warn({
                    socketId: socket.id,
                    ip,
                    headers: socket.handshake.headers
                }, 'Anonymous socket connection attempt');
            }

            socket.on('disconnect', () => {
                logger.info({ socketId: socket.id }, 'Socket disconnected');
            });
        });

        logger.info('SocketService initialized successfully');
    }

    getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io not initialized');
        }
        return this.io;
    }

    emitToUser(userId: string, event: string, data: any) {
        this.getIO().to(`user:${userId}`).emit(event, data);
    }

    emitToRoom(room: string, event: string, data: any) {
        this.getIO().to(room).emit(event, data);
    }
}

export default new SocketService();
