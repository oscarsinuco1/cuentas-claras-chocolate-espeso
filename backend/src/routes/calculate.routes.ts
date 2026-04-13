import type { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { calculateSplits } from '../services/calculator.service.js';

export async function calculateRoutes(fastify: FastifyInstance) {
  // Calculate splits
  fastify.get('/:code/calculate', {
    schema: {
      description: 'Calculate expense splits and transfers',
      tags: ['Calculate'],
      response: {
        200: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalExpenses: { type: 'number' },
                totalPeople: { type: 'number' },
                perPersonShare: { type: 'number' },
              },
            },
            balances: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  participantId: { type: 'string' },
                  name: { type: 'string' },
                  totalExpenses: { type: 'number' },
                  multiplier: { type: 'number' },
                  owes: { type: 'number' },
                  balance: { type: 'number' },
                  paymentLink: { type: 'string' },
                },
              },
            },
            transfers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  fromName: { type: 'string' },
                  to: { type: 'string' },
                  toName: { type: 'string' },
                  amount: { type: 'number' },
                  paymentLink: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };

    const plan = await prisma.plan.findUnique({
      where: { code },
      include: {
        participants: {
          where: { isActive: true },
        },
        expenses: true,
      },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const result = calculateSplits(plan.participants, plan.expenses);
    return result;
  });

  // Get summary only (lighter endpoint)
  fastify.get('/:code/summary', {
    schema: {
      description: 'Get quick summary of a plan',
      tags: ['Calculate'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };

    const plan = await prisma.plan.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            participants: { where: { isActive: true } },
            expenses: true,
          },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const totalExpenses = await prisma.expense.aggregate({
      where: { planId: plan.id },
      _sum: { amount: true },
    });

    const totalMultiplier = await prisma.participant.aggregate({
      where: { planId: plan.id, isActive: true },
      _sum: { multiplier: true },
    });

    const total = Number(totalExpenses._sum.amount ?? 0);
    const people = totalMultiplier._sum.multiplier ?? 0;

    return {
      code: plan.code,
      name: plan.name,
      isClosed: !!plan.closedAt,
      participantsCount: plan._count.participants,
      expensesCount: plan._count.expenses,
      totalExpenses: total,
      totalPeople: people,
      perPersonShare: people > 0 ? Math.round(total / people) : 0,
    };
  });
}
