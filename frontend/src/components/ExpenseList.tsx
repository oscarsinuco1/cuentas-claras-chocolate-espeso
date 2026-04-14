import { useState } from 'react';
import { Trash2, Receipt, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseApi } from '@/services/api';
import { formatMoney } from '@/utils/currency';
import type { Expense, Currency } from '@/types';

interface Props {
  planCode: string;
  expenses: Expense[];
  currency: Currency;
}

export default function ExpenseList({ planCode, expenses, currency }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await expenseApi.delete(planCode, id);
      toast.success('Eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(Math.round(Number(expense.amount)).toLocaleString('es-CO'));
  };

  const handleUpdate = async (id: string) => {
    const numAmount = parseInt(editAmount.replace(/\D/g, ''), 10);
    if (!numAmount || numAmount <= 0) {
      toast.error('Monto inválido');
      return;
    }
    try {
      await expenseApi.update(planCode, id, { amount: numAmount });
      setEditingId(null);
      toast.success('Actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const formatAmount = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits ? parseInt(digits).toLocaleString('es-CO') : '';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  // Color palette for expense avatars
  const avatarColors = [
    'from-primary-500 to-primary-600',
    'from-success-400 to-success-500',
    'from-warning-400 to-warning-500',
    'from-danger-400 to-danger-500',
    'from-primary-400 to-primary-500',
    'from-success-500 to-success-600',
  ];

  if (expenses.length === 0) {
    return (
      <div className="card text-center py-10">
        <div className="text-5xl mb-3 animate-float">🧾</div>
        <p className="text-text-secondary font-medium">No hay gastos aun</p>
        <p className="text-sm text-text-muted">Usa el formulario de arriba para agregar</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#13ec6d' }}>
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg text-text-primary">Gastos recientes</span>
          <p className="text-xs text-text-secondary">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {expenses.map((expense, index) => (
          <div
            key={expense.id}
            className="p-4 rounded-2xl border-2 transition-all"
            style={{ 
              borderColor: editingId === expense.id ? '#13ec6d' : 'transparent',
              backgroundColor: editingId === expense.id ? 'rgba(19, 236, 109, 0.1)' : '#141414'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white font-bold shadow-md`}>
                  {expense.participant?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold text-text-primary">{expense.participant?.name || 'Desconocido'}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(expense.createdAt)}
                    {expense.description && <span className="ml-1 text-primary-400">• {expense.description}</span>}
                  </p>
                </div>
              </div>
              {editingId === expense.id ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editAmount}
                      onChange={(e) => setEditAmount(formatAmount(e.target.value))}
                      className="input py-2 pl-8 w-32 text-right font-bold"
                      autoFocus
                    />
                  </div>
                  <button onClick={() => handleUpdate(expense.id)} className="p-2 text-white rounded-xl" style={{ backgroundColor: '#13ec6d' }}>
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(19, 236, 109, 0.1)' }}>
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg px-3 py-1 rounded-xl" style={{ backgroundColor: 'rgba(19, 236, 109, 0.15)', color: '#059669' }}>
                    {formatMoney(Number(expense.amount), currency)}
                  </span>
                  <button
                    onClick={() => startEdit(expense)}
                    className="p-2 rounded-xl transition-all"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(19, 236, 109, 0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Pencil className="w-4 h-4 text-primary-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 rounded-xl transition-all"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(240, 40, 73, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 className="w-4 h-4 text-danger-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
