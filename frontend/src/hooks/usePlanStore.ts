import { create } from 'zustand';
import type { Plan, Participant, Expense, CalculationResult } from '@/types';

interface PlanState {
  plan: Plan | null;
  participants: Participant[];
  expenses: Expense[];
  calculation: CalculationResult | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPlan: (plan: Plan | null) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (expenseId: string) => void;
  setCalculation: (calculation: CalculationResult | null) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  plan: null,
  participants: [],
  expenses: [],
  calculation: null,
  isConnected: false,
  isLoading: false,
  error: null,
};

export const usePlanStore = create<PlanState>((set) => ({
  ...initialState,

  setPlan: (plan) => set({ plan }),
  
  setParticipants: (participants) => set({ participants }),
  
  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),
  
  updateParticipant: (participant) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participant.id ? participant : p
      ),
    })),
  
  removeParticipant: (participantId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== participantId),
      // Also remove associated expenses
      expenses: state.expenses.filter((e) => e.participantId !== participantId),
    })),
  
  setExpenses: (expenses) => set({ expenses }),
  
  addExpense: (expense) =>
    set((state) => ({
      expenses: [expense, ...state.expenses],
    })),
  
  updateExpense: (expense) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === expense.id ? expense : e
      ),
    })),
  
  removeExpense: (expenseId) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    })),
  
  setCalculation: (calculation) => set({ calculation }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));
