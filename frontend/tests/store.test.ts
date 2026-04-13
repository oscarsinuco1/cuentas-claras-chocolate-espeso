import { describe, it, expect, beforeEach } from 'vitest';
import { usePlanStore } from '../src/hooks/usePlanStore';

describe('usePlanStore', () => {
  beforeEach(() => {
    usePlanStore.getState().reset();
  });

  it('should have correct initial state', () => {
    const state = usePlanStore.getState();
    
    expect(state.plan).toBeNull();
    expect(state.participants).toHaveLength(0);
    expect(state.expenses).toHaveLength(0);
    expect(state.calculation).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set plan', () => {
    const plan = {
      id: '1',
      code: 'TEST-1234',
      name: 'Test Plan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usePlanStore.getState().setPlan(plan);
    
    expect(usePlanStore.getState().plan).toEqual(plan);
  });

  it('should add participant', () => {
    const participant = {
      id: 'p1',
      planId: '1',
      name: 'Oscar',
      multiplier: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usePlanStore.getState().addParticipant(participant);
    
    expect(usePlanStore.getState().participants).toHaveLength(1);
    expect(usePlanStore.getState().participants[0]).toEqual(participant);
  });

  it('should update participant', () => {
    const participant = {
      id: 'p1',
      planId: '1',
      name: 'Oscar',
      multiplier: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usePlanStore.getState().addParticipant(participant);
    
    const updated = { ...participant, name: 'Oscar Updated', multiplier: 2 };
    usePlanStore.getState().updateParticipant(updated);
    
    expect(usePlanStore.getState().participants[0]?.name).toBe('Oscar Updated');
    expect(usePlanStore.getState().participants[0]?.multiplier).toBe(2);
  });

  it('should remove participant', () => {
    const participant = {
      id: 'p1',
      planId: '1',
      name: 'Oscar',
      multiplier: 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usePlanStore.getState().addParticipant(participant);
    usePlanStore.getState().removeParticipant('p1');
    
    expect(usePlanStore.getState().participants).toHaveLength(0);
  });

  it('should add expense', () => {
    const expense = {
      id: 'e1',
      planId: '1',
      participantId: 'p1',
      amount: '100000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usePlanStore.getState().addExpense(expense);
    
    expect(usePlanStore.getState().expenses).toHaveLength(1);
  });

  it('should remove expense', () => {
    const expense = {
      id: 'e1',
      planId: '1',
      participantId: 'p1',
      amount: '100000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usePlanStore.getState().addExpense(expense);
    usePlanStore.getState().removeExpense('e1');
    
    expect(usePlanStore.getState().expenses).toHaveLength(0);
  });

  it('should reset state', () => {
    usePlanStore.getState().setPlan({
      id: '1',
      code: 'TEST-1234',
      name: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    usePlanStore.getState().setConnected(true);
    usePlanStore.getState().setLoading(true);

    usePlanStore.getState().reset();

    const state = usePlanStore.getState();
    expect(state.plan).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});
