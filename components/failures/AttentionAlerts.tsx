import { AlertTriangle, TrendingUp } from 'lucide-react'
import type { FailureByType } from '@/lib/failures'

export default function AttentionAlerts({ types }: { types: FailureByType[] }) {
  if (types.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <span className="text-emerald-400 text-lg">✓</span>
        <div>
          <p className="text-sm font-semibold text-emerald-400">Nenhum procedimento crítico</p>
          <p className="text-xs text-slate-500">Todos os tipos estão abaixo do limiar de 30% de falha</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-400">
        <AlertTriangle size={12} />
        <span>{types.length} tipo{types.length > 1 ? 's' : ''} precisando de atenção</span>
        <span className="text-slate-600 font-normal normal-case tracking-normal">
          — taxa de falha ≥ 30% com ≥ 2 registros
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <div
            key={t.type}
            className="flex flex-col gap-2 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-orange-300 leading-tight">{t.label}</p>
              <div className="flex items-center gap-1 flex-shrink-0 rounded-full bg-red-500/20 px-2 py-0.5">
                <TrendingUp size={10} className="text-red-400" />
                <span className="text-xs font-bold text-red-400">{t.failureRate}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${t.failureRate}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {t.failureCount} falha{t.failureCount > 1 ? 's' : ''} em {t.totalCount} tentativa{t.totalCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
