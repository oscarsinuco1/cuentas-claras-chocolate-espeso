import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../utils/prisma.js';
import { historyService } from '../services/history.service.js';
import { invalidateCache, publishEvent, getPlanChannel } from '../utils/redis.js';
import { generateAvatarSeed } from '../utils/codeGenerator.js';

// Schemas
const createExpenseSchema = z.object({
  participantId: z.string(),
  amount: z.number().positive().max(999999999999),
  description: z.string().max(200).optional(),
});

const updateExpenseSchema = z.object({
  amount: z.number().positive().max(999999999999).optional(),
  description: z.string().max(200).optional(),
});

// Quick add schema - for rapid expense entry
const quickAddExpenseSchema = z.object({
  participantName: z.string().min(1).max(50),
  amount: z.number().positive(),
  description: z.string().max(200).optional(),
  multiplier: z.number().int().min(1).max(10).optional(),
});

export async function expenseRoutes(fastify: FastifyInstance) {
  // Add expense
  fastify.post('/:code/expenses', {
    schema: {
      description: 'Add an expense to a plan',
      tags: ['Expenses'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const body = createExpenseSchema.parse(request.body);

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    if (plan.closedAt) {
      return reply.status(400).send({ error: 'Plan is closed' });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: body.participantId },
    });

    if (!participant || participant.planId !== plan.id || !participant.isActive) {
      return reply.status(404).send({ error: 'Participant not found' });
    }

    const expense = await prisma.expense.create({
      data: {
        planId: plan.id,
        participantId: body.participantId,
        amount: new Decimal(body.amount),
        description: body.description ?? null,
      },
      include: {
        participant: { select: { name: true } },
      },
    });

    await historyService.record(plan.id, 'CREATE_EXPENSE', 'EXPENSE', expense.id, null, expense);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'EXPENSE_ADDED', data: expense });

    return reply.status(201).send(expense);
  });

  // Quick add expense (creates participant if needed)
  fastify.post('/:code/expenses/quick', {
    schema: {
      description: 'Quickly add an expense, creating participant if needed',
      tags: ['Expenses'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const body = quickAddExpenseSchema.parse(request.body);

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    if (plan.closedAt) {
      return reply.status(400).send({ error: 'Plan is closed' });
    }

    // Find or create participant
    let participant = await prisma.participant.findFirst({
      where: { planId: plan.id, name: body.participantName },
    });

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          planId: plan.id,
          name: body.participantName,
          avatarSeed: generateAvatarSeed(),
          multiplier: body.multiplier ?? 1,
        },
      });
      await historyService.record(plan.id, 'CREATE_PARTICIPANT', 'PARTICIPANT', participant.id, null, participant);
      await publishEvent(getPlanChannel(code), { type: 'PARTICIPANT_ADDED', data: participant });
    } else if (!participant.isActive || (body.multiplier && participant.multiplier !== body.multiplier)) {
      // Reactivate and/or update multiplier
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { 
          isActive: true,
          ...(body.multiplier && { multiplier: body.multiplier }),
        },
      });
    }

    const expense = await prisma.expense.create({
      data: {
        planId: plan.id,
        participantId: participant.id,
        amount: new Decimal(body.amount),
        description: body.description ?? null,
      },
      include: {
        participant: { select: { name: true } },
      },
    });

    await historyService.record(plan.id, 'CREATE_EXPENSE', 'EXPENSE', expense.id, null, expense);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'EXPENSE_ADDED', data: expense });

    return reply.status(201).send(expense);
  });

  // Update expense
  fastify.patch('/:code/expenses/:expenseId', {
    schema: {
      description: 'Update an expense',
      tags: ['Expenses'],
    },
  }, async (request, reply) => {
    const { code, expenseId } = request.params as { code: string; expenseId: string };
    const body = updateExpenseSchema.parse(request.body);

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.planId !== plan.id) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    const updateData: { amount?: Decimal; description?: string } = {};
    if (body.amount !== undefined) {
      updateData.amount = new Decimal(body.amount);
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        participant: { select: { name: true } },
      },
    });

    await historyService.record(plan.id, 'UPDATE_EXPENSE', 'EXPENSE', expense.id, existing, expense);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'EXPENSE_UPDATED', data: expense });

    return expense;
  });

  // Delete expense
  fastify.delete('/:code/expenses/:expenseId', {
    schema: {
      description: 'Delete an expense',
      tags: ['Expenses'],
    },
  }, async (request, reply) => {
    const { code, expenseId } = request.params as { code: string; expenseId: string };

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!existing || existing.planId !== plan.id) {
      return reply.status(404).send({ error: 'Expense not found' });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    await historyService.record(plan.id, 'DELETE_EXPENSE', 'EXPENSE', expenseId, existing, null);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'EXPENSE_DELETED', data: { id: expenseId } });

    return reply.status(204).send();
  });

  // Get all expenses
  fastify.get('/:code/expenses', {
    schema: {
      description: 'Get all expenses in a plan',
      tags: ['Expenses'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const expenses = await prisma.expense.findMany({
      where: { planId: plan.id },
      include: {
        participant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return expenses;
  });
}
