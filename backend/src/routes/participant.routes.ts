import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { historyService } from '../services/history.service.js';
import { invalidateCache, publishEvent, getPlanChannel } from '../utils/redis.js';
import { generateAvatarSeed } from '../utils/codeGenerator.js';

// Schemas
const createParticipantSchema = z.object({
  name: z.string().min(1).max(50),
  paymentLink: z.string().max(500).transform(s => s.trim()).optional(),
  multiplier: z.number().int().min(1).max(10).default(1),
});

const updateParticipantSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  paymentLink: z.string().max(500).transform(s => s.trim()).nullable().optional(),
  multiplier: z.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
  avatarSeed: z.string().max(50).optional(),
});

export async function participantRoutes(fastify: FastifyInstance) {
  // Add participant to plan
  fastify.post('/:code/participants', {
    schema: {
      description: 'Add a participant to a plan',
      tags: ['Participants'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const body = createParticipantSchema.parse(request.body);

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    if (plan.closedAt) {
      return reply.status(400).send({ error: 'Plan is closed' });
    }

    // Check if participant already exists
    const existing = await prisma.participant.findFirst({
      where: { planId: plan.id, name: body.name },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        const updated = await prisma.participant.update({
          where: { id: existing.id },
          data: { isActive: true, ...body },
        });
        
        await historyService.record(plan.id, 'REACTIVATE_PARTICIPANT', 'PARTICIPANT', existing.id, existing, updated);
        await publishEvent(getPlanChannel(code), { type: 'PARTICIPANT_UPDATED', data: updated });
        
        return reply.status(200).send(updated);
      }
      return reply.status(409).send({ error: 'Participant already exists' });
    }

    const participant = await prisma.participant.create({
      data: {
        planId: plan.id,
        name: body.name,
        avatarSeed: generateAvatarSeed(),
        paymentLink: body.paymentLink || null,
        multiplier: body.multiplier,
      },
    });

    await historyService.record(plan.id, 'CREATE_PARTICIPANT', 'PARTICIPANT', participant.id, null, participant);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'PARTICIPANT_ADDED', data: participant });

    return reply.status(201).send(participant);
  });

  // Update participant
  fastify.patch('/:code/participants/:participantId', {
    schema: {
      description: 'Update a participant',
      tags: ['Participants'],
    },
  }, async (request, reply) => {
    const { code, participantId } = request.params as { code: string; participantId: string };
    const body = updateParticipantSchema.parse(request.body);

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const existing = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!existing || existing.planId !== plan.id) {
      return reply.status(404).send({ error: 'Participant not found' });
    }

    // Convert empty paymentLink to null
    const updateData = {
      ...body,
      paymentLink: body.paymentLink === '' ? null : body.paymentLink,
    };

    const participant = await prisma.participant.update({
      where: { id: participantId },
      data: updateData,
    });

    await historyService.record(plan.id, 'UPDATE_PARTICIPANT', 'PARTICIPANT', participant.id, existing, participant);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'PARTICIPANT_UPDATED', data: participant });

    return participant;
  });

  // Remove participant (hard delete - cascades to expenses)
  fastify.delete('/:code/participants/:participantId', {
    schema: {
      description: 'Remove a participant from a plan',
      tags: ['Participants'],
    },
  }, async (request, reply) => {
    const { code, participantId } = request.params as { code: string; participantId: string };

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const existing = await prisma.participant.findUnique({ 
      where: { id: participantId },
      include: { expenses: true }
    });
    if (!existing || existing.planId !== plan.id) {
      return reply.status(404).send({ error: 'Participant not found' });
    }

    // Hard delete - cascades to expenses automatically
    await prisma.participant.delete({
      where: { id: participantId },
    });

    await historyService.record(plan.id, 'DELETE_PARTICIPANT', 'PARTICIPANT', participantId, existing, null);
    await invalidateCache(`plan:${code}:*`);
    await publishEvent(getPlanChannel(code), { type: 'PARTICIPANT_DELETED', data: { id: participantId, expenses: existing.expenses } });

    return reply.status(204).send();
  });

  // Get all participants
  fastify.get('/:code/participants', {
    schema: {
      description: 'Get all participants in a plan',
      tags: ['Participants'],
    },
  }, async (request, reply) => {
    const { code } = request.params as { code: string };
    const { includeInactive } = request.query as { includeInactive?: string };

    const plan = await prisma.plan.findUnique({ where: { code } });
    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const participants = await prisma.participant.findMany({
      where: {
        planId: plan.id,
        ...(includeInactive !== 'true' && { isActive: true }),
      },
      orderBy: { createdAt: 'asc' },
    });

    return participants;
  });
}
