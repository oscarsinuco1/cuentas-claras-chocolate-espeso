import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { planRoutes } from '../src/routes/plan.routes.js';
import { participantRoutes } from '../src/routes/participant.routes.js';
import { expenseRoutes } from '../src/routes/expense.routes.js';
import { calculateRoutes } from '../src/routes/calculate.routes.js';

// Note: These are integration tests that require a real database connection
// For CI, you would mock the database or use a test database

describe.skip('API Integration Tests', () => {
  let app: ReturnType<typeof Fastify>;
  let planCode: string;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(cors);
    await app.register(planRoutes, { prefix: '/api/plans' });
    await app.register(participantRoutes, { prefix: '/api/plans' });
    await app.register(expenseRoutes, { prefix: '/api/plans' });
    await app.register(calculateRoutes, { prefix: '/api/plans' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Plans API', () => {
    it('should create a new plan', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/plans',
        payload: { name: 'Test Plan', description: 'Integration test' },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(body.name).toBe('Test Plan');
      planCode = body.code;
    });

    it('should get plan by code', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/plans/${planCode}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(planCode);
    });

    it('should return 404 for non-existent plan', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/plans/XXXX-XXXX',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Participants API', () => {
    let participantId: string;

    it('should add participant to plan', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/plans/${planCode}/participants`,
        payload: { name: 'Oscar', multiplier: 2 },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Oscar');
      expect(body.multiplier).toBe(2);
      participantId = body.id;
    });

    it('should update participant payment link', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/plans/${planCode}/participants/${participantId}`,
        payload: { paymentLink: 'https://nequi.com/oscar' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.paymentLink).toBe('https://nequi.com/oscar');
    });
  });

  describe('Expenses API', () => {
    it('should add expense using quick add', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/plans/${planCode}/expenses/quick`,
        payload: { participantName: 'Juan', amount: 150000 },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(Number(body.amount)).toBe(150000);
    });
  });

  describe('Calculate API', () => {
    it('should calculate splits', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/plans/${planCode}/calculate`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.summary).toBeDefined();
      expect(body.balances).toBeDefined();
      expect(body.transfers).toBeDefined();
    });
  });
});
