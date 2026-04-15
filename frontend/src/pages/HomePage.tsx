import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, Receipt, Sparkles } from 'lucide-react';
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
        <div className="text-center space-y-4 animate-bounce-in">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
            <Receipt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">
            Cuentas Claras
          </h1>
          <p className="text-base text-text-secondary font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-warning-400" />
            Divide gastos de forma simple
            <Sparkles className="w-4 h-4 text-warning-400" />
          </p>
        </div>

        {/* Join Plan */}
        <div id="unirse-plan" className="card animate-slide-up stagger-1">
          <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Unirse a un plan</h2>
          </div>
          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              maxLength={14}
              className="input flex-1 text-center font-mono uppercase tracking-widest text-xl"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isJoining || joinCode.length < 14}
              className="btn-primary px-6"
            >
              {isJoining ? (
                <span className="animate-spin">...</span>
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 animate-slide-up stagger-2">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }} />
          <span className="text-sm text-text-muted">o</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }} />
        </div>

        {/* Create Plan */}
        <div id="crear-plan" className="card animate-slide-up stagger-3">
          <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Crear nuevo plan</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ej: Viaje a la playa"
              maxLength={100}
              className="input"
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
              className="btn-success w-full"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  Creando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Crear Plan
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 animate-slide-up stagger-4">
          <p className="text-sm text-text-muted">
            Divide gastos facil y rapido
          </p>
          <p className="text-xs text-text-muted opacity-60">
            Protegido por reCAPTCHA.{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-secondary">
              Privacidad
            </a>{' '}y{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-secondary">
              Términos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

