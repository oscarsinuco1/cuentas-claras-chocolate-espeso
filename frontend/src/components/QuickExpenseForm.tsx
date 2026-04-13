import { useState, useRef, useEffect } from 'react';
import { Plus, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseApi } from '@/services/api';
import { formatMoney } from '@/utils/currency';
import type { Participant, Currency } from '@/types';

interface Props {
  planCode: string;
  participants: Participant[];
  currency: Currency;
}

export default function QuickExpenseForm({ planCode, participants, currency }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (name.trim()) {
      const filtered = participants
        .filter(p => p.name.toLowerCase().includes(name.toLowerCase()))
        .map(p => p.name)
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [name, participants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    // Remove ALL non-digits (dots are thousand separators in es-CO)
    const numAmount = parseInt(amount.replace(/\D/g, ''), 10);
    
    if (!trimmedName || !numAmount || numAmount <= 0) {
      toast.error('Completa nombre y monto');
      return;
    }

    setIsSubmitting(true);
    try {
      await expenseApi.quickAdd(planCode, {
        participantName: trimmedName,
        amount: numAmount,
      });
      setName('');
      setAmount('');
      toast.success(`+${formatMoney(numAmount, currency)}`, { duration: 1000 });
      inputRef.current?.focus();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
    amountRef.current?.focus();
  };

  const formatAmount = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format with thousands separator
    return digits ? parseInt(digits).toLocaleString('es-CO') : '';
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-slate-800">Agregar gasto</span>
      </div>

      <div className="space-y-3">
        {/* Name Input with autocomplete */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Quien pago?"
            className="input"
            autoComplete="off"
            disabled={isSubmitting}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 w-full mt-2 bg-white border-2 border-purple-200 rounded-2xl shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors font-medium"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Amount + Submit row */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">$</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.target.value))}
              placeholder="0"
              className="input pl-10 text-xl font-bold"
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !amount}
            className="btn-success px-6"
          >
            {isSubmitting ? (
              <span className="animate-spin">+</span>
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
