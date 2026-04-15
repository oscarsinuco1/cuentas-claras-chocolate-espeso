import { useState, useMemo } from 'react';
import { Users, Link as LinkIcon, ChevronDown, ChevronUp, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { participantApi, expenseApi } from '@/services/api';
import { formatMoney } from '@/utils/currency';
import { getAvatarUrl } from '@/utils/avatar';
import type { Participant, Expense, Currency } from '@/types';

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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2374E1' }}>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-text-primary">Participantes</span>
            <p className="text-xs text-text-secondary">{participants.length} miembro{participants.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="p-2 rounded-lg transition-all" style={{ backgroundColor: isExpanded ? '#3A3B3C' : '#2D2E2F' }}>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-primary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Participant list */}
          {participants.map((p) => {
            const participantExpenses = expensesByParticipant.get(p.id) || [];
            const totalPaid = totalByParticipant.get(p.id) || 0;
            const isEditing = editingId === p.id;
            
            return (
                <div
                key={p.id}
                className="rounded-lg border transition-all overflow-hidden"
                style={{ 
                  borderColor: isEditing ? '#2374E1' : '#3E4042', 
                  backgroundColor: isEditing ? 'rgba(35, 116, 225, 0.1)' : '#2D2E2F' 
                }}
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
                        <span className="text-sm text-text-secondary">Paga por</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.multiplier}
                          onChange={(e) => setEditForm({ ...editForm, multiplier: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                          className="input py-2 w-16 text-center font-bold"
                          placeholder="1"
                        />
                        <span className="text-sm text-text-secondary">persona(s)</span>
                      </div>
                      
                      {/* Edit expenses */}
                      {editExpenses.length > 0 && (
                        <div className="pt-3 mt-3" style={{ borderTop: '1px solid #3E4042' }}>
                          <p className="text-sm font-bold text-text-secondary mb-2">Gastos:</p>
                          <div className="space-y-2">
                            {editExpenses.map((exp) => (
                              <div key={exp.id} className="flex items-center gap-2">
                                <span className="text-text-muted font-bold">$</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={exp.amount}
                                  onChange={(e) => updateExpenseAmount(exp.id, e.target.value)}
                                  className="input py-1.5 flex-1 text-right font-bold"
                                />
                                <button 
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 rounded-full transition-colors"
                                  style={{ backgroundColor: 'transparent' }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(240, 40, 73, 0.2)'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Trash2 className="w-4 h-4 text-danger-400" />
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
                        <img 
                          src={getAvatarUrl(p.avatarSeed, p.name)} 
                          alt={p.name}
                          className="w-10 h-10 rounded-lg shadow-md"
                        />
                        <div>
                          <p className="font-bold text-text-primary">{p.name}</p>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            {p.multiplier > 1 && (
                          <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#3A3B3C', color: '#B0B3B8' }}>
                                x{p.multiplier}
                              </span>
                            )}
                            {p.paymentLink && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.paymentLink!);
                                  toast.success('Info de pago copiada', { duration: 1500 });
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors"
                                style={{ backgroundColor: 'rgba(35, 116, 225, 0.2)', color: '#5AAFFA' }}
                              >
                                <LinkIcon className="w-3 h-3" />
                                Copiar pago
                              </button>
                            )}
                            {participantExpenses.length > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#3A3B3C', color: '#8A8D91' }}>
                                {participantExpenses.length} gasto{participantExpenses.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-success-400">
                          {formatMoney(totalPaid, currency)}
                        </p>
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 rounded-full transition-all"
                            title="Editar"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3A3B3C'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Pencil className="w-4 h-4 text-text-muted" />
                          </button>
                          <button
                            onClick={() => handleRemove(p.id)}
                            className="p-1.5 rounded-full transition-all"
                            title="Eliminar"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(240, 40, 73, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 className="w-4 h-4 text-danger-400" />
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

