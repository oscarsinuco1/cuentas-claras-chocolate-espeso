import type { Participant, Expense } from '@prisma/client';

export interface Balance {
  participantId: string;
  name: string;
  totalExpenses: number;
  multiplier: number;
  owes: number;
  balance: number; // positive = owed money, negative = owes money
  paymentLink: string | null;
}

export interface Transfer {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  paymentLink: string | null;
}

export interface SplitResult {
  summary: {
    totalExpenses: number;
    totalPeople: number;
    perPersonShare: number;
  };
  balances: Balance[];
  transfers: Transfer[];
}

/**
 * Calculate expense splits and minimum transfers
 * Uses greedy algorithm to minimize number of transfers
 */
export function calculateSplits(
  participants: Participant[],
  expenses: Expense[]
): SplitResult {
  // Calculate totals
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const totalPeople = participants.reduce((sum, p) => sum + p.multiplier, 0);

  if (totalPeople === 0) {
    return {
      summary: { totalExpenses, totalPeople: 0, perPersonShare: 0 },
      balances: [],
      transfers: [],
    };
  }

  const perPersonShare = totalExpenses / totalPeople;

  // Calculate per-participant expenses
  const expensesByParticipant = new Map<string, number>();
  for (const expense of expenses) {
    const current = expensesByParticipant.get(expense.participantId) ?? 0;
    expensesByParticipant.set(expense.participantId, current + Number(expense.amount));
  }

  // Calculate balances
  const balances: Balance[] = participants.map((p) => {
    const totalSpent = expensesByParticipant.get(p.id) ?? 0;
    const owes = perPersonShare * p.multiplier;
    const balance = totalSpent - owes; // positive = paid more, negative = owes
    
    return {
      participantId: p.id,
      name: p.name,
      totalExpenses: Math.round(totalSpent),
      multiplier: p.multiplier,
      owes: Math.round(owes),
      balance: Math.round(balance),
      paymentLink: p.paymentLink,
    };
  });

  // Calculate minimum transfers using greedy algorithm
  const transfers = calculateMinimumTransfers(balances);

  return {
    summary: {
      totalExpenses: Math.round(totalExpenses),
      totalPeople,
      perPersonShare: Math.round(perPersonShare),
    },
    balances,
    transfers,
  };
}

/**
 * Greedy algorithm to calculate minimum transfers
 * Sort by balance, match largest debtor with largest creditor
 */
function calculateMinimumTransfers(balances: Balance[]): Transfer[] {
  const EPSILON = 0.5; // Ignore differences less than 50 cents
  
  // Separate debtors and creditors
  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .map((b) => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining); // Largest debt first

  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .map((b) => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining); // Largest credit first

  const transfers: Transfer[] = [];
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    if (!debtor || !creditor) break;

    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > EPSILON) {
      transfers.push({
        from: debtor.participantId,
        fromName: debtor.name,
        to: creditor.participantId,
        toName: creditor.name,
        amount: Math.round(amount),
        paymentLink: creditor.paymentLink,
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining < EPSILON) debtorIdx++;
    if (creditor.remaining < EPSILON) creditorIdx++;
  }

  return transfers;
}
