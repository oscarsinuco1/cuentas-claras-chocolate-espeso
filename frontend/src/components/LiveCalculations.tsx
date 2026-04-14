import { useMemo } from 'react';
import { ArrowRightLeft, Copy, CheckCircle } from 'lucide-react';
import type { Participant, Expense, Currency } from '@/types';
import { formatMoney } from '@/utils/currency';

interface Props {
  participants: Participant[];
  expenses: Expense[];
  currency: Currency;
}

interface Balance {
  participantId: string;
  name: string;
  totalExpenses: number;
  multiplier: number;
  owes: number;
  balance: number;
  paymentLink?: string | null;
}

interface Transfer {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  paymentLink?: string | null;
}

export default function LiveCalculations({ participants, expenses, currency }: Props) {
  const calculation = useMemo(() => {
    const activeParticipants = participants.filter(p => p.isActive);
    
    if (activeParticipants.length === 0) {
      return null;
    }

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPeople = activeParticipants.reduce((sum, p) => sum + p.multiplier, 0);
    const perPersonShare = totalPeople > 0 ? totalExpenses / totalPeople : 0;

    // Calculate balances
    const balances: Balance[] = activeParticipants.map(p => {
      const totalPaid = expenses
        .filter(e => e.participantId === p.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const owes = perPersonShare * p.multiplier;
      const balance = totalPaid - owes;

      return {
        participantId: p.id,
        name: p.name,
        totalExpenses: totalPaid,
        multiplier: p.multiplier,
        owes,
        balance,
        paymentLink: p.paymentLink,
      };
    });

    // Calculate transfers (simplified algorithm)
    const transfers: Transfer[] = [];
    const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b }));
    const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b }));

    debtors.sort((a, b) => a.balance - b.balance); // Most negative first
    creditors.sort((a, b) => b.balance - a.balance); // Most positive first

    for (const debtor of debtors) {
      let remaining = Math.abs(debtor.balance);
      
      for (const creditor of creditors) {
        if (remaining < 0.01 || creditor.balance < 0.01) continue;
        
        const amount = Math.min(remaining, creditor.balance);
        if (amount >= 0.01) {
          transfers.push({
            from: debtor.participantId,
            fromName: debtor.name,
            to: creditor.participantId,
            toName: creditor.name,
            amount: Math.round(amount * 100) / 100,
            paymentLink: creditor.paymentLink,
          });
          remaining -= amount;
          creditor.balance -= amount;
        }
      }
    }

    return {
      summary: {
        totalExpenses,
        totalPeople,
        perPersonShare,
      },
      balances,
      transfers,
    };
  }, [participants, expenses]);

  if (!calculation || participants.length === 0) {
    return null;
  }

  const { transfers } = calculation;

  // No transfers needed
  if (transfers.length === 0) {
    return (
      <div className="card text-center py-4">
        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-success-400" />
        <p className="text-lg font-semibold text-text-primary">Todos a paz y salvo</p>
        <p className="text-text-secondary text-sm">No hay transferencias pendientes</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-base mb-3 text-text-primary">
        Liquidaciones Sugeridas
      </h3>
      <div className="space-y-2">
        {transfers.map((t, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(19, 236, 109, 0.08)', border: 'none' }}
          >
            <div className="flex items-center gap-2 flex-1 flex-wrap text-sm">
              <ArrowRightLeft className="w-4 h-4 text-primary-600\" />
              <span className="text-text-secondary">
                <span className="font-medium text-text-primary">{t.fromName}</span>
                {' le debe a '}
                <span className="font-medium text-text-primary">{t.toName}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-text-primary">
                {formatMoney(t.amount, currency)}
              </span>
              {t.paymentLink && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(t.paymentLink!);
                    alert('Copiado: ' + t.paymentLink);
                  }}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: 'rgba(35, 116, 225, 0.2)', color: '#5AAFFA' }}
                  title="Copiar info de pago"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
