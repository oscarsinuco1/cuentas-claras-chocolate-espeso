import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, Share2, Check, WifiOff, History, Home, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { planApi } from '@/services/api';
import { connectSocket, disconnectSocket, joinPlan, leavePlan, onPlanUpdate, onConnected, onDisconnected } from '@/services/socket';
import { usePlanStore } from '@/hooks/usePlanStore';
import { formatMoney } from '@/utils/currency';
import type { PlanUpdateEvent, Expense, Participant } from '@/types';
import QuickExpenseForm from '@/components/QuickExpenseForm';
import ParticipantList from '@/components/ParticipantList';
import LiveCalculations from '@/components/LiveCalculations';
import HistoryModal from '@/components/HistoryModal';
import AdBanner from '@/components/AdBanner';

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

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Código copiado');
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
      // Fallback: copiar mensaje completo al portapapeles
      try {
        await navigator.clipboard.writeText(getShareMessage());
        toast.success('Enlace copiado');
      } catch {
        toast.error('No se pudo compartir');
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center space-y-4 animate-bounce-in">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(240, 40, 73, 0.2)' }}>
            <AlertCircle className="w-8 h-8 text-danger-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Plan no encontrado</h1>
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
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <p className="text-text-secondary text-sm font-medium">Cargando plan...</p>
      </div>
    );
  }

  // Only count expenses from existing participants
  const validExpenses = expenses.filter(e => participants.some(p => p.id === e.participantId));
  const totalExpenses = validExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currency = plan.currency || 'COP';

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ backgroundColor: '#0A0A0A', borderBottom: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
        <div className="max-w-lg mx-auto px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => navigate('/')} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'transparent' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <div className="min-w-0">
                <h1 className="font-bold text-lg text-text-primary truncate">{plan.name}</h1>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-text-secondary px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>{code}</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#059669' }}>{currency}</span>
                <button onClick={handleCopyCode} className="p-1.5 rounded-full transition-colors" style={{ backgroundColor: 'transparent' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4 text-text-muted" />}
                </button>
              </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-primary-700">En vivo</span>
                </div>
              ) : (
                <WifiOff className="w-4 h-4 text-text-muted" />
              )}
              <button onClick={handleShare} className="btn-primary p-2 rounded-full">
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

        {/* Ad Banner 1 - Después del formulario */}
        <AdBanner adSlot="2985305921" format="auto" className="animate-slide-up" />

        {/* Summary Card - Simple */}
        <div className="card animate-slide-up stagger-1" style={{ backgroundColor: '#3B82F6' }}>
          <div className="text-center py-1">
            <p className="text-white/80 text-xs font-medium">Gastos Totales</p>
            <p className="text-3xl font-bold text-white">
              {formatMoney(totalExpenses, currency)}
            </p>
            <p className="text-white/70 text-sm">
              {participants.length} miembro{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="animate-slide-up stagger-2">
          <ParticipantList planCode={code!} participants={participants} expenses={expenses} currency={currency} />
        </div>

        {/* Ad Banner 2 - Después de participantes */}
        <AdBanner adSlot="5007179048" format="auto" className="animate-slide-up stagger-2" />

        {/* Transfers Only */}
        <div className="animate-slide-up stagger-3">
          <LiveCalculations participants={participants} expenses={expenses} currency={currency} />
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3" style={{ backgroundColor: '#0A0A0A', borderTop: 'none', boxShadow: '0 -1px 3px rgba(0,0,0,0.3)' }}>
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowHistory(true)}
            className="w-full py-2.5 font-semibold rounded-full flex items-center justify-center gap-2 transition-all text-sm text-text-primary"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: 'none' }}
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

