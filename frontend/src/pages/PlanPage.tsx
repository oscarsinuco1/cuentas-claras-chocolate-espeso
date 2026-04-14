import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, Share2, Check, WifiOff, History, Home } from 'lucide-react';
import { planApi } from '@/services/api';
import { connectSocket, disconnectSocket, joinPlan, leavePlan, onPlanUpdate, onConnected, onDisconnected } from '@/services/socket';
import { usePlanStore } from '@/hooks/usePlanStore';
import { formatMoney } from '@/utils/currency';
import type { PlanUpdateEvent, Expense, Participant } from '@/types';
import QuickExpenseForm from '@/components/QuickExpenseForm';
import ParticipantList from '@/components/ParticipantList';
import LiveCalculations from '@/components/LiveCalculations';
import HistoryModal from '@/components/HistoryModal';

export default function PlanPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const { 
    plan, setPlan, 
    participants, setParticipants, addParticipant, updateParticipant, removeParticipant,
    expenses, setExpenses, addExpense, updateExpense, removeExpense 
  } = usePlanStore();

  // Fetch plan data
  const { data, isLoading, error } = useQuery({
    queryKey: ['plan', code],
    queryFn: () => planApi.get(code!),
    enabled: !!code,
    retry: false,
  });

  // Set initial data
  useEffect(() => {
    if (data) {
      setPlan(data);
      setParticipants(data.participants || []);
      setExpenses(data.expenses || []);
    }
  }, [data, setPlan, setParticipants, setExpenses]);

  // Setup WebSocket
  useEffect(() => {
    if (!code) return;

    connectSocket();
    
    const unsubConnect = onConnected(() => {
      setIsConnected(true);
      joinPlan(code);
    });

    const unsubDisconnect = onDisconnected(() => {
      setIsConnected(false);
    });

    const unsubUpdate = onPlanUpdate((event: PlanUpdateEvent) => {
      switch (event.type) {
        case 'PARTICIPANT_ADDED':
          addParticipant(event.data as Participant);
          break;
        case 'PARTICIPANT_UPDATED':
          updateParticipant(event.data as Participant);
          break;
        case 'PARTICIPANT_REMOVED':
          removeParticipant((event.data as Participant).id);
          break;
        case 'PARTICIPANT_DELETED':
          // Hard delete - also removes expenses, refetch all data
          removeParticipant((event.data as { id: string }).id);
          queryClient.invalidateQueries({ queryKey: ['expenses', code] });
          break;
        case 'EXPENSE_ADDED':
          addExpense(event.data as Expense);
          break;
        case 'EXPENSE_UPDATED':
          updateExpense(event.data as Expense);
          break;
        case 'EXPENSE_DELETED':
          removeExpense((event.data as { id: string }).id);
          break;
        case 'PLAN_UPDATED':
        case 'PLAN_CLOSED':
          queryClient.invalidateQueries({ queryKey: ['plan', code] });
          break;
      }
    });

    return () => {
      leavePlan(code);
      unsubConnect();
      unsubDisconnect();
      unsubUpdate();
      disconnectSocket();
    };
  }, [code, addParticipant, updateParticipant, removeParticipant, addExpense, updateExpense, removeExpense, queryClient]);

  const getShareMessage = () => {
    if (!plan || !code) return '';
    return `🍫 ¡Cuentas claras, chocolate espeso! 🍫

"${plan.name}"

💸 Entra al plan y agrega tus gastos:
${window.location.href}

📝 Código: ${code}`;
  };

  const handleCopy = async () => {
    if (!code || !plan) return;
    try {
      await navigator.clipboard.writeText(getShareMessage());
      setCopied(true);
      toast.success('¡Enlace copiado! 🎉');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleShare = async () => {
    if (!code || !plan) return;
    try {
      await navigator.share({
        title: `🍫 ${plan.name}`,
        text: getShareMessage(),
        url: window.location.href,
      });
    } catch {
      handleCopy();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center space-y-4 animate-bounce-in">
          <div className="text-6xl">😕</div>
          <h1 className="text-2xl font-bold text-slate-800">Plan no encontrado</h1>
          <button onClick={() => navigate('/')} className="btn-primary">
            <Home className="w-5 h-5 mr-2 inline" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-slate-400">Cargando...</div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currency = plan.currency || 'COP';

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-dark shadow-2xl">
        <div className="max-w-lg mx-auto px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-lg text-white truncate drop-shadow-lg">{plan.name}</h1>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">{code}</span>
                <span className="text-xs bg-slate-600 text-slate-200 px-2 py-0.5 rounded font-medium">{currency}</span>
                <button onClick={handleCopy} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/80" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-1 bg-emerald-600/30 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-medium text-emerald-300">En vivo</span>
                </div>
              ) : (
                <WifiOff className="w-4 h-4 text-white/50" />
              )}
              <button onClick={handleShare} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-3 py-4 space-y-4">
        {/* Quick Add Form */}
        <div className="animate-slide-up">
          <QuickExpenseForm planCode={code!} participants={participants} currency={currency} />
        </div>

        {/* Summary Card - Simple */}
        <div className="card-gradient animate-slide-up stagger-1">
          <div className="text-center py-1">
            <p className="text-white/80 text-xs font-medium">Total gastos</p>
            <p className="text-3xl font-black text-white drop-shadow-lg">
              {formatMoney(totalExpenses, currency)}
            </p>
            <p className="text-white/70 text-sm">
              {participants.length} persona{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="animate-slide-up stagger-2">
          <ParticipantList planCode={code!} participants={participants} expenses={expenses} currency={currency} />
        </div>

        {/* Transfers Only */}
        <div className="animate-slide-up stagger-3">
          <LiveCalculations participants={participants} expenses={expenses} currency={currency} />
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 glass-dark p-3 shadow-2xl">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowHistory(true)}
            className="w-full py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
          >
            <History className="w-4 h-4" />
            Ver Historial
          </button>
        </div>
      </div>

      {/* Modals */}
      {showHistory && (
        <HistoryModal 
          planCode={code!} 
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
}
