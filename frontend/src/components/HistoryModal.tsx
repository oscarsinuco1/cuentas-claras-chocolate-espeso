import { useQuery } from '@tanstack/react-query';
import { X, Clock, Loader2, Plus, Pencil, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { historyApi } from '@/services/api';

interface Props {
  planCode: string;
  onClose: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE_EXPENSE: <Plus className="w-4 h-4 text-emerald-500" />,
  UPDATE_EXPENSE: <Pencil className="w-4 h-4 text-amber-500" />,
  DELETE_EXPENSE: <Trash2 className="w-4 h-4 text-red-500" />,
  CREATE_PARTICIPANT: <UserPlus className="w-4 h-4 text-primary-500" />,
  UPDATE_PARTICIPANT: <Pencil className="w-4 h-4 text-amber-500" />,
  REMOVE_PARTICIPANT: <UserMinus className="w-4 h-4 text-red-500" />,
  REACTIVATE_PARTICIPANT: <UserPlus className="w-4 h-4 text-emerald-500" />,
};

const ACTION_LABELS: Record<string, string> = {
  CREATE_EXPENSE: 'Nuevo gasto',
  UPDATE_EXPENSE: 'Gasto editado',
  DELETE_EXPENSE: 'Gasto eliminado',
  CREATE_PARTICIPANT: 'Nuevo participante',
  UPDATE_PARTICIPANT: 'Participante editado',
  REMOVE_PARTICIPANT: 'Participante eliminado',
  REACTIVATE_PARTICIPANT: 'Participante reactivado',
};

export default function HistoryModal({ planCode, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['history', planCode],
    queryFn: () => historyApi.getAll(planCode),
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-CO', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDescription = (entry: { action: string; newData?: unknown; oldData?: unknown }) => {
    const data = (entry.newData || entry.oldData) as Record<string, unknown> | undefined;
    if (!data) return '';

    if (entry.action.includes('EXPENSE')) {
      const amount = data.amount as string | number;
      return amount ? `$${Number(amount).toLocaleString('es-CO')}` : '';
    }
    if (entry.action.includes('PARTICIPANT')) {
      return data.name as string || '';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up" style={{ backgroundColor: '#141414' }}>
        {/* Header */}
        <div className="sticky top-0 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#141414', borderBottom: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-text-secondary" />
            <h2 className="text-lg font-bold text-text-primary">Historial de cambios</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'transparent' }}>
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-danger-400">
              Error al cargar historial
            </div>
          )}

          {data && data.data.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No hay cambios registrados
            </div>
          )}

          {data && data.data.length > 0 && (
            <div className="space-y-1">
              {data.data.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    {ACTION_ICONS[entry.action] || <Clock className="w-4 h-4 text-text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-text-primary">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    <p className="text-sm text-text-secondary truncate">
                      {getDescription(entry)}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

