import type { Plan, Participant, Expense, CalculationResult, HistoryEntry, PlanSummary, Currency } from '@/types';
import { getRecaptchaToken } from './recaptcha';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/**
 * Make a protected request with reCAPTCHA token
 */
async function protectedRequest<T>(endpoint: string, action: string, options?: RequestInit): Promise<T> {
  const token = await getRecaptchaToken(action);
  
  return request<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token && { 'x-recaptcha-token': token }),
    },
  });
}

// Plans
export const planApi = {
  create: (data: { name: string; description?: string; currency?: Currency }) =>
    protectedRequest<Plan>('/plans', 'create_plan', { method: 'POST', body: JSON.stringify(data) }),

  get: (code: string) =>
    request<Plan>(`/plans/${code}`),

  getSummary: (code: string) =>
    request<PlanSummary>(`/plans/${code}/summary`),

  update: (code: string, data: { name?: string; description?: string }) =>
    request<Plan>(`/plans/${code}`, { method: 'PATCH', body: JSON.stringify(data) }),

  close: (code: string) =>
    request<Plan>(`/plans/${code}/close`, { method: 'POST' }),

  delete: (code: string) =>
    request<void>(`/plans/${code}`, { method: 'DELETE' }),
};

// Participants
export const participantApi = {
  getAll: (planCode: string) =>
    request<Participant[]>(`/plans/${planCode}/participants`),

  add: (planCode: string, data: { name: string; paymentLink?: string; multiplier?: number }) =>
    request<Participant>(`/plans/${planCode}/participants`, { method: 'POST', body: JSON.stringify(data) }),

  update: (planCode: string, participantId: string, data: Partial<Participant>) =>
    request<Participant>(`/plans/${planCode}/participants/${participantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (planCode: string, participantId: string) =>
    request<void>(`/plans/${planCode}/participants/${participantId}`, { method: 'DELETE' }),
};

// Expenses
export const expenseApi = {
  getAll: (planCode: string) =>
    request<Expense[]>(`/plans/${planCode}/expenses`),

  add: (planCode: string, data: { participantId: string; amount: number; description?: string }) =>
    request<Expense>(`/plans/${planCode}/expenses`, { method: 'POST', body: JSON.stringify(data) }),

  quickAdd: (planCode: string, data: { participantName: string; amount: number; description?: string; multiplier?: number }) =>
    request<Expense & { _newParticipant?: Participant }>(`/plans/${planCode}/expenses/quick`, { method: 'POST', body: JSON.stringify(data) }),

  update: (planCode: string, expenseId: string, data: { amount?: number; description?: string }) =>
    request<Expense>(`/plans/${planCode}/expenses/${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (planCode: string, expenseId: string) =>
    request<void>(`/plans/${planCode}/expenses/${expenseId}`, { method: 'DELETE' }),
};

// Calculations
export const calculateApi = {
  getSplits: (planCode: string) =>
    request<CalculationResult>(`/plans/${planCode}/calculate`),
};

// History
export const historyApi = {
  getAll: (planCode: string, limit = 50, offset = 0) =>
    request<{ data: HistoryEntry[]; pagination: { total: number; hasMore: boolean } }>(
      `/plans/${planCode}/history?limit=${limit}&offset=${offset}`
    ),
};
