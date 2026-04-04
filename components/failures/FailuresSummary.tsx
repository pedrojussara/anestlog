import { XCircle, Percent, AlertTriangle, TrendingDown } from 'lucide-react'
import type { FailuresData } from '@/lib/failures'

export default function FailuresSummary({ data }: { data: FailuresData }) {
  const lastMonth = data.trend.at(-1)
  const prevMonth = data.trend.at(-2)
  const trend = lastMonth && prevMonth
    ? lastMonth.rate - prevMonth.rate
    : null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card
        icon={<XCircle size={16} />}
        label="Total de falhas"
        value={data.totalFailures}
        sub={`de ${data.totalProcedures} procedimentos`}
        iconBg="bg-red-500/10" iconColor="text-red-400" valueColor="text-red-400"
      />
      <Card
        icon={<Percent size={16} />}
        label="Taxa de falha geral"
        value={`${data.overallRate}%`}
        sub={data.overallRate <= 15 ? 'Dentro do esperado' : 'Acima da meta'}
        iconBg={data.overallRate <= 15 ? 'bg-emerald-500/10' : 'bg-red-500/10'}
        iconColor={data.overallRate <= 15 ? 'text-emerald-400' : 'text-red-400'}
        valueColor={data.overallRate <= 15 ? 'text-emerald-400' : 'text-red-400'}
      />
      <Card
        icon={<AlertTriangle size={16} />}
        label="Precisam de atenção"
        value={data.attentionTypes.length}
        sub={data.attentionTypes.length > 0
          ? data.attentionTypes.slice(0, 2).map((t) => t.label).join(', ')
          : 'Nenhum tipo crítico'}
        iconBg={data.attentionTypes.length > 0 ? 'bg-orange-500/10' : 'bg-emerald-500/10'}
        iconColor={data.attentionTypes.length > 0 ? 'text-orange-400' : 'text-emerald-400'}
        valueColor={data.attentionTypes.length > 0 ? 'text-orange-400' : 'text-emerald-400'}
      />
      <Card
        icon={<TrendingDown size={16} />}
        label="Tendência (último mês)"
        value={trend == null ? 'N/D' : trend === 0 ? 'Estável' : `${trend > 0 ? '+' : ''}${trend}%`}
        sub={trend == null ? 'dados insuficientes' : trend > 0 ? 'piora recente' : trend < 0 ? 'melhora recente' : 'sem variação'}
        iconBg={trend == null || trend === 0 ? 'bg-slate-700' : trend > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}
        iconColor={trend == null || trend === 0 ? 'text-slate-500' : trend > 0 ? 'text-red-400' : 'text-emerald-400'}
        valueColor={trend == null || trend === 0 ? 'text-slate-400' : trend > 0 ? 'text-red-400' : 'text-emerald-400'}
      />
    </div>
  )
}

function Card({
  icon, label, value, sub, iconBg, iconColor, valueColor,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string
  iconBg: string; iconColor: string; valueColor: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4">
      <div className={`w-fit rounded-lg p-2 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-bold leading-tight ${valueColor}`}>{value}</p>
        <p className="mt-0.5 text-xs text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{sub}</p>}
      </div>
    </div>
  )
}
