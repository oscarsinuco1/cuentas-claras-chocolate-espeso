import { useState, useMemo } from 'react';
import { Users, Link as LinkIcon, ChevronDown, ChevronUp, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { participantApi, expenseApi } from '@/services/api';
import { formatMoney } from '@/utils/currency';
import type { Participant, Expense, Currency } from '@/types';
import clsx from 'clsx';

// Color palette for avatars - warm tones
const avatarColors = [
  'from-primary-500 to-primary-600',
  'from-accent-500 to-accent-600',
  'from-sage-500 to-sage-600',
  'from-amber-500 to-amber-600',
  'from-coral-400 to-coral-500',
  'from-primary-400 to-primary-500',
];

interface Props {
  planCode: string;
  participants: Participant[];
  expenses: Expense[];
  currency: Currency;
}

interface ExpenseEdit {
  id: string;
  amount: string;
}

export default function ParticipantList({ planCode, participants, expenses, currency }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', paymentLink: '', multiplier: '1' });
  const [editExpenses, setEditExpenses] = useState<ExpenseEdit[]>([]);

  // Group expenses by participant
  const expensesByParticipant = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const list = map.get(e.participantId) || [];
      list.push(e);
      map.set(e.participantId, list);
    }
    return map;
  }, [expenses]);

  // Calculate total per participant
  const totalByParticipant = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const current = map.get(e.participantId) || 0;
      map.set(e.participantId, current + Number(e.amount));
    }
    return map;
  }, [expenses]);

  const startEdit = (p: Participant) => {
    const participantExpenses = expensesByParticipant.get(p.id) || [];
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      paymentLink: p.paymentLink || '',
      multiplier: String(p.multiplier),
    });
    setEditExpenses(participantExpenses.map(e => ({
      id: e.id,
      amount: Math.round(Number(e.amount)).toLocaleString('es-CO')
    })));
  };

  const handleSaveAll = async (id: string) => {
    const multiplier = parseInt(editForm.multiplier) || 1;
    try {
      // Update participant
      await participantApi.update(planCode, id, {
        name: editForm.name,
        paymentLink: editForm.paymentLink || null,
        multiplier: Math.max(1, Math.min(10, multiplier)),
      });
      
      // Update expenses
      for (const exp of editExpenses) {
        const numAmount = parseInt(exp.amount.replace(/\D/g, ''), 10);
        if (numAmount && numAmount > 0) {
          await expenseApi.update(planCode, exp.id, { amount: numAmount });
        }
      }
      
      setEditingId(null);
      toast.success('Guardado');
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Eliminar participante y todos sus gastos?')) return;
    try {
      await participantApi.remove(planCode, id);
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expenseApi.delete(planCode, expenseId);
      setEditExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast.success('Gasto eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const formatAmount = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits ? parseInt(digits).toLocaleString('es-CO') : '';
  };

  const updateExpenseAmount = (expenseId: string, value: string) => {
    setEditExpenses(prev => prev.map(e => 
      e.id === expenseId ? { ...e, amount: formatAmount(value) } : e
    ));
  };

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3f918a 0%, #5aada6 100%)' }}>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-gray-800">Participantes</span>
            <p className="text-xs text-gray-500">{participants.length} persona{participants.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-gray-100' : 'bg-gray-50'}`}>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Participant list */}
          {participants.map((p, index) => {
            const participantExpenses = expensesByParticipant.get(p.id) || [];
            const totalPaid = totalByParticipant.get(p.id) || 0;
            const isEditing = editingId === p.id;
            
            return (
                <div
                key={p.id}
                className={clsx(
                  'rounded-lg border transition-all overflow-hidden',
                  isEditing 
                    ? 'border-primary-300 bg-primary-50' 
                    : 'border-gray-100 bg-gray-50'
                )}
              >
                <div className="p-3">
                  {isEditing ? (
                    /* EDIT MODE - all fields */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input py-2"
                        placeholder="Nombre"
                      />
                      <input
                        type="text"
                        value={editForm.paymentLink}
                        onChange={(e) => setEditForm({ ...editForm, paymentLink: e.target.value })}
                        className="input py-2"
                        placeholder="A dónde pagar (Nequi, cuenta, alias...)"
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-600">Paga por</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.multiplier}
                          onChange={(e) => setEditForm({ ...editForm, multiplier: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                          className="input py-2 w-16 text-center font-bold"
                          placeholder="1"
                        />
                        <span className="text-sm text-gray-600">persona(s)</span>
                      </div>
                      
                      {/* Edit expenses */}
                      {editExpenses.length > 0 && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <p className="text-sm font-bold text-gray-600 mb-2">Gastos:</p>
                          <div className="space-y-2">
                            {editExpenses.map((exp) => (
                              <div key={exp.id} className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold">$</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={exp.amount}
                                  onChange={(e) => updateExpenseAmount(exp.id, e.target.value)}
                                  className="input py-1.5 flex-1 text-right font-bold"
                                />
                                <button 
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 hover:bg-coral-100 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4 text-coral-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleSaveAll(p.id)} className="btn-success flex-1 py-2">
                          <Check className="w-5 h-5 mx-auto" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-2">
                          <X className="w-5 h-5 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            {p.multiplier > 1 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                x{p.multiplier}
                              </span>
                            )}
                            {p.paymentLink && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.paymentLink!);
                                  alert('Copiado: ' + p.paymentLink);
                                }}
                                className="text-primary-600 hover:bg-primary-100 flex items-center gap-1 bg-primary-50 px-2 py-0.5 rounded text-xs transition-colors"
                              >
                                <LinkIcon className="w-3 h-3" />
                                Copiar pago
                              </button>
                            )}
                            {participantExpenses.length > 0 && (
                              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">
                                {participantExpenses.length} gasto{participantExpenses.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-sage-600">
                          {formatMoney(totalPaid, currency)}
                        </p>
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleRemove(p.id)}
                            className="p-1.5 hover:bg-coral-100 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-coral-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
