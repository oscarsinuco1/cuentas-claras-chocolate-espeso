export type Currency = 'COP' | 'USD' | 'EUR' | 'MXN' | 'ARS' | 'PEN' | 'CLP' | 'BRL';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  participants?: Participant[];
  expenses?: Expense[];
}

export interface Participant {
  id: string;
  planId: string;
  name: string;
  avatarSeed?: string | null;
  paymentLink?: string | null;
  multiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  planId: string;
  participantId: string;
  participant?: { name: string };
  amount: string | number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  participantId: string;
  name: string;
  totalExpenses: number;
  multiplier: number;
  owes: number;
  balance: number;
  paymentLink?: string | null;
}

export interface Transfer {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  paymentLink?: string | null;
}

export interface CalculationResult {
  summary: {
    totalExpenses: number;
    totalPeople: number;
    perPersonShare: number;
  };
  balances: Balance[];
  transfers: Transfer[];
}

export interface HistoryEntry {
  id: string;
  planId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  createdAt: string;
}

export interface PlanSummary {
  code: string;
  name: string;
  isClosed: boolean;
  participantsCount: number;
  expensesCount: number;
  totalExpenses: number;
  totalPeople: number;
  perPersonShare: number;
}

// WebSocket events
export interface PlanUpdateEvent {
  type:
    | 'PLAN_UPDATED'
    | 'PLAN_CLOSED'
    | 'PARTICIPANT_ADDED'
    | 'PARTICIPANT_UPDATED'
    | 'PARTICIPANT_REMOVED'
    | 'PARTICIPANT_DELETED'
    | 'EXPENSE_ADDED'
    | 'EXPENSE_UPDATED'
    | 'EXPENSE_DELETED';
  data: unknown;
}
