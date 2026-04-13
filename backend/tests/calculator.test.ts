import { describe, it, expect } from 'vitest';
import { calculateSplits } from '../src/services/calculator.service.js';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to create mock participant
function createParticipant(id: string, name: string, multiplier = 1, paymentLink: string | null = null) {
  return {
    id,
    planId: 'plan-1',
    name,
    paymentLink,
    multiplier,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper to create mock expense
function createExpense(id: string, participantId: string, amount: number) {
  return {
    id,
    planId: 'plan-1',
    participantId,
    amount: new Decimal(amount),
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Calculator Service', () => {
  describe('calculateSplits', () => {
    it('should return empty result for empty inputs', () => {
      const result = calculateSplits([], []);
      
      expect(result.summary.totalExpenses).toBe(0);
      expect(result.summary.totalPeople).toBe(0);
      expect(result.summary.perPersonShare).toBe(0);
      expect(result.balances).toHaveLength(0);
      expect(result.transfers).toHaveLength(0);
    });

    it('should handle single participant', () => {
      const participants = [createParticipant('p1', 'Oscar', 1)];
      const expenses = [createExpense('e1', 'p1', 100000)];
      
      const result = calculateSplits(participants, expenses);
      
      expect(result.summary.totalExpenses).toBe(100000);
      expect(result.summary.totalPeople).toBe(1);
      expect(result.summary.perPersonShare).toBe(100000);
      expect(result.balances).toHaveLength(1);
      expect(result.balances[0]?.balance).toBe(0); // Paid exactly what they owe
      expect(result.transfers).toHaveLength(0);
    });

    it('should calculate even split correctly', () => {
      const participants = [
        createParticipant('p1', 'Oscar', 1),
        createParticipant('p2', 'Juan', 1),
      ];
      const expenses = [createExpense('e1', 'p1', 200000)];
      
      const result = calculateSplits(participants, expenses);
      
      expect(result.summary.totalExpenses).toBe(200000);
      expect(result.summary.perPersonShare).toBe(100000);
      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0]?.from).toBe('p2');
      expect(result.transfers[0]?.to).toBe('p1');
      expect(result.transfers[0]?.amount).toBe(100000);
    });

    it('should handle multipliers (paying for multiple people)', () => {
      const participants = [
        createParticipant('p1', 'Oscar', 2), // Pays for 2
        createParticipant('p2', 'Juan', 1),
      ];
      const expenses = [
        createExpense('e1', 'p1', 300000), // Oscar paid 300k
      ];
      
      const result = calculateSplits(participants, expenses);
      
      // Total: 300k, 3 people, per person: 100k
      expect(result.summary.totalPeople).toBe(3);
      expect(result.summary.perPersonShare).toBe(100000);
      
      // Oscar paid 300k, owes 200k (2 people), balance = +100k
      // Juan paid 0, owes 100k, balance = -100k
      const oscarBalance = result.balances.find(b => b.name === 'Oscar');
      const juanBalance = result.balances.find(b => b.name === 'Juan');
      
      expect(oscarBalance?.balance).toBe(100000);
      expect(juanBalance?.balance).toBe(-100000);
      
      // Juan should pay Oscar 100k
      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0]?.fromName).toBe('Juan');
      expect(result.transfers[0]?.toName).toBe('Oscar');
      expect(result.transfers[0]?.amount).toBe(100000);
    });

    it('should replicate the HTML example scenario', () => {
      // From the original HTML:
      // Juanse: 771000, mult: 2
      // Oscar: 256800, mult: 2
      // Hector: 46350, mult: 2
      // Miguel: 90000, mult: 2
      // Wilmer: 140000, mult: 1
      // Jhon: 130000, mult: 1
      // David: 80000, mult: 1
      
      const participants = [
        createParticipant('p1', 'Juanse', 2),
        createParticipant('p2', 'Oscar', 2),
        createParticipant('p3', 'Hector', 2),
        createParticipant('p4', 'Miguel', 2),
        createParticipant('p5', 'Wilmer', 1),
        createParticipant('p6', 'Jhon', 1),
        createParticipant('p7', 'David', 1),
      ];
      
      const expenses = [
        createExpense('e1', 'p1', 771000),
        createExpense('e2', 'p2', 256800),
        createExpense('e3', 'p3', 46350),
        createExpense('e4', 'p4', 90000),
        createExpense('e5', 'p5', 140000),
        createExpense('e6', 'p6', 130000),
        createExpense('e7', 'p7', 80000),
      ];
      
      const result = calculateSplits(participants, expenses);
      
      // Total: 1,514,150 | People: 11 | Per person: ~137,650
      expect(result.summary.totalExpenses).toBe(1514150);
      expect(result.summary.totalPeople).toBe(11);
      expect(Math.round(result.summary.perPersonShare)).toBe(137650);
      
      // Juanse paid 771k, owes 275,300 (2 people), balance = +495,700 (big creditor)
      const juanseBalance = result.balances.find(b => b.name === 'Juanse');
      expect(juanseBalance?.balance).toBeGreaterThan(0);
      
      // Verify transfers minimize the number of transactions
      expect(result.transfers.length).toBeLessThanOrEqual(6); // At most n-1 transfers
    });

    it('should include payment links in transfers', () => {
      const participants = [
        createParticipant('p1', 'Oscar', 1, 'https://nequi.com/oscar'),
        createParticipant('p2', 'Juan', 1, null),
      ];
      const expenses = [createExpense('e1', 'p1', 200000)];
      
      const result = calculateSplits(participants, expenses);
      
      expect(result.transfers[0]?.paymentLink).toBe('https://nequi.com/oscar');
    });

    it('should handle multiple expenses per participant', () => {
      const participants = [
        createParticipant('p1', 'Oscar', 1),
        createParticipant('p2', 'Juan', 1),
      ];
      const expenses = [
        createExpense('e1', 'p1', 50000),
        createExpense('e2', 'p1', 50000),
        createExpense('e3', 'p2', 100000),
      ];
      
      const result = calculateSplits(participants, expenses);
      
      expect(result.summary.totalExpenses).toBe(200000);
      
      // Both paid 100k, owe 100k each - no transfers needed
      expect(result.transfers).toHaveLength(0);
    });

    it('should handle complex multi-party scenario with minimal transfers', () => {
      const participants = [
        createParticipant('p1', 'A', 1),
        createParticipant('p2', 'B', 1),
        createParticipant('p3', 'C', 1),
        createParticipant('p4', 'D', 1),
      ];
      const expenses = [
        createExpense('e1', 'p1', 400000), // A paid all
      ];
      
      const result = calculateSplits(participants, expenses);
      
      // Per person: 100k
      // A: +300k, B: -100k, C: -100k, D: -100k
      expect(result.transfers).toHaveLength(3);
      
      // All transfers should be TO person A
      result.transfers.forEach(t => {
        expect(t.toName).toBe('A');
        expect(t.amount).toBe(100000);
      });
    });
  });
});
