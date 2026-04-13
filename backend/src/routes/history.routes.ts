import type { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';

export async function historyRoutes(fastify: FastifyInstance) {
  // Get plan history
  fastify.get('/:code/history', {
    schema: {
      description: 'Get change history for a plan',
      tags: ['History'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
          entityType: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const { limit = 50, offset = 0, entityType } = request.query as {
      limit?: number;
      offset?: number;
      entityType?: string;
    };

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const where = {
      planId: plan.id,
      ...(entityType && { entityType }),
    };

    const [history, total] = await Promise.all([
      prisma.historyEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      prisma.historyEntry.count({ where }),
    ]);

    return {
      data: history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total,
      },
    };
  });

  // Get specific entity history
  fastify.get('/:code/history/:entityType/:entityId', {
    schema: {
      description: 'Get history for a specific entity',
      tags: ['History'],
    },
  }, async (request, reply) => {
    const { code, entityType, entityId } = request.params as {
      code: string;
      entityType: string;
      entityId: string;
    };

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const history = await prisma.historyEntry.findMany({
      where: {
        planId: plan.id,
        entityType: entityType.toUpperCase(),
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  });
}
