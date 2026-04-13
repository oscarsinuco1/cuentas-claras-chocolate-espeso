import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Server } from 'socket.io';

import { prisma } from './utils/prisma.js';
import { redis, redisPub, redisSub } from './utils/redis.js';
import { planRoutes } from './routes/plan.routes.js';
import { participantRoutes } from './routes/participant.routes.js';
import { expenseRoutes } from './routes/expense.routes.js';
import { historyRoutes } from './routes/history.routes.js';
import { calculateRoutes } from './routes/calculate.routes.js';
import { setupSocketHandlers } from './services/socket.service.js';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    },
  });

  // Security & CORS
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
  });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger Documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Cuentas Claras API',
        description: 'API para división de gastos en tiempo real',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${PORT}` }],
    },
  });
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Routes
  await fastify.register(planRoutes, { prefix: '/api/plans' });
  await fastify.register(participantRoutes, { prefix: '/api/plans' });
  await fastify.register(expenseRoutes, { prefix: '/api/plans' });
  await fastify.register(historyRoutes, { prefix: '/api/plans' });
  await fastify.register(calculateRoutes, { prefix: '/api/plans' });

  return fastify;
}

async function main() {
  const fastify = await buildApp();

  // Initialize Fastify first to get the server instance
  await fastify.ready();

  // Setup Socket.io on the Fastify's underlying HTTP server
  const io = new Server(fastify.server, {
    cors: {
      origin: CORS_ORIGIN,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Setup Redis pub/sub for Socket.io
  setupSocketHandlers(io, redisSub);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await fastify.close();
    await prisma.$disconnect();
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

export { buildApp };
