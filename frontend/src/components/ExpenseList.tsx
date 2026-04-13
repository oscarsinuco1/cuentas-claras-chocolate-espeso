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
    'from-cyan-400 to-blue-500',
    'from-green-400 to-emerald-500',
    'from-yellow-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-purple-400 to-indigo-500',
    'from-red-400 to-pink-500',
  ];

  if (expenses.length === 0) {
    return (
      <div className="card text-center py-10">
        <div className="text-5xl mb-3 animate-float">🧾</div>
        <p className="text-slate-600 font-medium">No hay gastos aun</p>
        <p className="text-sm text-slate-400">Usa el formulario de arriba para agregar</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-800">Gastos recientes</span>
          <p className="text-xs text-slate-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {expenses.map((expense, index) => (
          <div
            key={expense.id}
            className={`p-4 rounded-2xl border-2 transition-all ${
              editingId === expense.id 
                ? 'border-purple-300 bg-purple-50' 
                : 'bg-gradient-to-r from-slate-50 to-white border-slate-100 hover:border-purple-200 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white font-bold shadow-md`}>
                  {expense.participant?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{expense.participant?.name || 'Desconocido'}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(expense.createdAt)}
                    {expense.description && <span className="ml-1 text-purple-500">• {expense.description}</span>}
                  </p>
                </div>
              </div>
              {editingId === expense.id ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editAmount}
                      onChange={(e) => setEditAmount(formatAmount(e.target.value))}
                      className="input py-2 pl-8 w-32 text-right font-bold"
                      autoFocus
                    />
                  </div>
                  <button onClick={() => handleUpdate(expense.id)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl">
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-green-600 bg-green-50 px-3 py-1 rounded-xl">
                    {formatMoney(Number(expense.amount), currency)}
                  </span>
                  <button
                    onClick={() => startEdit(expense)}
                    className="p-2 hover:bg-purple-100 rounded-xl transition-all"
                  >
                    <Pencil className="w-4 h-4 text-purple-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 hover:bg-red-100 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
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
