import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { generatePlanCode, isValidPlanCode } from '../utils/codeGenerator.js';
import { invalidateCache, publishEvent, getPlanChannel } from '../utils/redis.js';
import { verifyRecaptcha } from '../middleware/recaptcha.js';

// Schemas
const VALID_CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'PEN', 'CLP', 'BRL'] as const;

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  currency: z.enum(VALID_CURRENCIES).default('COP'),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export async function planRoutes(fastify: FastifyInstance) {
  // Create a new plan (protected with reCAPTCHA + stricter rate limit)
  fastify.post('/', {
    schema: {
      description: 'Create a new expense plan',
      tags: ['Plans'],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          currency: { type: 'string', enum: ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'PEN', 'CLP', 'BRL'] },
        },
      },
    },
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    preHandler: verifyRecaptcha,
  }, async (request, reply) => {
    const body = createPlanSchema.parse(request.body);
    
    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = generatePlanCode();
      const existing = await prisma.plan.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return reply.status(500).send({ error: 'Failed to generate unique code' });
    }

    const plan = await prisma.plan.create({
      data: {
        code,
        name: body.name,
        description: body.description ?? null,
        currency: body.currency,
      },
    });

    return reply.status(201).send(plan);
  });

  // Get plan by code
  fastify.get('/:code', {
    schema: {
      description: 'Get plan by code',
      tags: ['Plans'],
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };

    if (!isValidPlanCode(code)) {
      return reply.status(400).send({ error: 'Invalid plan code format' });
    }

    const plan = await prisma.plan.findUnique({
      where: { code },
      include: {
        participants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
        expenses: {
          orderBy: { createdAt: 'desc' },
          include: {
            participant: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    return plan;
  });

  // Update plan
  fastify.patch('/:code', {
    schema: {
      description: 'Update plan details',
      tags: ['Plans'],
    },
  }, async (request, _reply) => {
    const { code } = request.params as { code: string };
    const body = updatePlanSchema.parse(request.body);

    const plan = await prisma.plan.update({
      where: { code },
      data: body,
    });

    // Invalidate cache and notify
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), {
      type: 'PLAN_UPDATED',
      data: plan,
    });

    return plan;
  });

  // Close plan (finalize)
  fastify.post('/:code/close', {
    schema: {
      description: 'Close/finalize a plan',
      tags: ['Plans'],
    },
  }, async (request, _reply) => {
    const { code } = request.params as { code: string };

    const plan = await prisma.plan.update({
      where: { code },
      data: { closedAt: new Date() },
    });

    await publishEvent(getPlanChannel(code), {
      type: 'PLAN_CLOSED',
      data: plan,
    });

    return plan;
  });

  // Delete plan
  fastify.delete('/:code', {
    schema: {
      description: 'Delete a plan',
      tags: ['Plans'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };

    await prisma.plan.delete({ where: { code } });
    await invalidateCache(`plan:${code}:*`);

    return reply.status(204).send();
  });
}
