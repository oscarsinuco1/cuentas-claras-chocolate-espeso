import { useQuery } from '@tanstack/react-query';
import { X, ArrowRight, Copy, Loader2 } from 'lucide-react';
import { calculateApi } from '@/services/api';

interface Props {
  planCode: string;
  onClose: () => void;
}

export default function CalculationModal({ planCode, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calculation', planCode],
    queryFn: () => calculateApi.getSplits(planCode),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up" style={{ backgroundColor: '#242526' }}>
        {/* Header */}
        <div className="sticky top-0 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#242526', borderBottom: '1px solid #3E4042' }}>
          <h2 className="text-lg font-bold text-text-primary">Cálculo de cuentas</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'transparent' }}>
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-danger-400">
              Error al calcular
            </div>
          )}

          {data && (
            <>
              {/* Summary */}
              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'rgba(49, 162, 76, 0.15)', border: '1px solid rgba(49, 162, 76, 0.3)' }}>
                <div className="flex justify-between">
                  <span className="text-success-400">Total gastos</span>
                  <span className="font-bold text-success-300">
                    ${data.summary.totalExpenses.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-success-400">Personas</span>
                  <span className="font-bold text-success-300">{data.summary.totalPeople}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-success-400 font-medium">Por persona</span>
                  <span className="font-bold text-success-300">
                    ${data.summary.perPersonShare.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Balances */}
              <div>
                <h3 className="font-semibold mb-3 text-text-primary">Balance por persona</h3>
                <div className="space-y-2">
                  {data.balances.map((b) => (
                    <div key={b.participantId} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#2D2E2F' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ backgroundColor: '#3A3B3C' }}>
                          {b.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{b.name}</p>
                          <p className="text-xs text-text-secondary">
                            Pagó ${b.totalExpenses.toLocaleString()} · Debe ${b.owes.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${b.balance >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                        {b.balance >= 0 ? '+' : ''}${b.balance.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transfers */}
              {data.transfers.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-text-primary">Transferencias</h3>
                  <div className="space-y-3">
                    {data.transfers.map((t, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl"
                        style={{ backgroundColor: 'rgba(35, 116, 225, 0.15)', border: '1px solid rgba(35, 116, 225, 0.3)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary-300">{t.fromName}</span>
                            <ArrowRight className="w-4 h-4 text-primary-400" />
                            <span className="font-medium text-primary-300">{t.toName}</span>
                          </div>
                          <span className="font-bold text-primary-300">
                            ${t.amount.toLocaleString('es-CO')}
                          </span>
                        </div>
                        {t.paymentLink && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(t.paymentLink!);
                              alert('Copiado: ' + t.paymentLink);
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors"
                            style={{ color: '#5AAFFA', backgroundColor: 'rgba(35, 116, 225, 0.2)' }}
                          >
                            <Copy className="w-4 h-4" />
                            Copiar info de pago
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.transfers.length === 0 && (
                <div className="text-center py-4 text-text-secondary">
                  ¡Todos están a paz y salvo! 🎉
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
