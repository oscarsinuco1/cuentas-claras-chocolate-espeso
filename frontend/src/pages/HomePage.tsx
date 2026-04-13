import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { planApi } from '@/services/api';
import { CURRENCIES, getPreferredCurrency, setPreferredCurrency } from '@/utils/currency';
import type { Currency } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [planName, setPlanName] = useState('');
  const [currency, setCurrency] = useState<Currency>('COP');

  useEffect(() => {
    setCurrency(getPreferredCurrency());
  }, []);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setPreferredCurrency(newCurrency);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.toUpperCase().trim();
    if (!code) return;

    setIsJoining(true);
    try {
      await planApi.get(code);
      navigate(`/plan/${code}`);
    } catch {
      toast.error('Plan no encontrado');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      toast.error('Ingresa un nombre para el plan');
      return;
    }

    setIsCreating(true);
    try {
      const plan = await planApi.create({ name: planName.trim(), currency });
      toast.success('Plan creado');
      navigate(`/plan/${plan.code}`);
    } catch {
      toast.error('Error al crear el plan');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3 animate-bounce-in">
          <div className="text-7xl mb-4 animate-float">🍫</div>
          <h1 className="text-4xl font-black text-white drop-shadow-lg">
            Cuentas Claras
          </h1>
          <p className="text-xl text-white/80 font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Chocolate Espeso
            <Sparkles className="w-5 h-5" />
          </p>
        </div>

        {/* Join Plan */}
        <div className="card animate-slide-up stagger-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Unirse a un plan</h2>
          </div>
          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="input flex-1 text-center font-mono uppercase tracking-widest text-xl"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isJoining || joinCode.length < 9}
              className="btn-kahoot px-6"
            >
              {isJoining ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <ArrowRight className="w-6 h-6" />
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 animate-slide-up stagger-2">
          <div className="flex-1 h-1 bg-white/30 rounded-full" />
          <span className="text-lg font-bold text-white/80">o</span>
          <div className="flex-1 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Create Plan */}
        <div className="card animate-slide-up stagger-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Crear nuevo plan</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ej: Paseo a Melgar 🏖️"
              maxLength={100}
              className="input text-lg"
              autoComplete="off"
            />
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
              className="input text-lg font-medium"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} - {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isCreating || !planName.trim()}
              className="btn-success w-full text-lg"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🍫</span> Creando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" /> Crear Plan
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/60 font-medium animate-slide-up stagger-4">
          Divide gastos facil y rapido ✨
        </p>
      </div>
    </div>
  );
}
