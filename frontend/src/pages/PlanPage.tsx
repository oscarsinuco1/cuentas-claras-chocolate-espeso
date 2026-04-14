import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, Share2, Check, WifiOff, History, Home, Loader2, AlertCircle } from 'lucide-react';
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
    return `Cuentas Claras - "${plan.name}"

Entra al plan:
${window.location.href}

Código: ${code}`;
  };

  const handleCopy = async () => {
    if (!code || !plan) return;
    try {
      await navigator.clipboard.writeText(getShareMessage());
      setCopied(true);
      toast.success('Enlace copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleShare = async () => {
    if (!code || !plan) return;
    try {
      await navigator.share({
        title: plan.name,
        text: getShareMessage(),
      });
    } catch {
      handleCopy();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center space-y-4 animate-bounce-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">Cargando plan...</p>
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
              <h1 className="font-bold text-lg text-slate-800 truncate">{plan.name}</h1>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-slate-600 bg-slate-200/50 px-2 py-0.5 rounded">{code}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">{currency}</span>
                <button onClick={handleCopy} className="p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-full border border-emerald-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700">En vivo</span>
                </div>
              ) : (
                <WifiOff className="w-4 h-4 text-slate-400" />
              )}
              <button onClick={handleShare} className="bg-blue-500 hover:bg-blue-600 p-2 rounded-xl transition-all shadow-lg shadow-blue-500/25">
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
            <p className="text-slate-500 text-xs font-medium">Total gastos</p>
            <p className="text-3xl font-bold text-slate-800">
              {formatMoney(totalExpenses, currency)}
            </p>
            <p className="text-slate-400 text-sm">
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
      <div className="fixed bottom-0 left-0 right-0 glass-dark p-3 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowHistory(true)}
            className="w-full py-2.5 bg-white/60 hover:bg-white/80 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-sm border border-white/50"
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
