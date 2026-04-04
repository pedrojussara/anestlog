import { Activity, CheckCircle2, TrendingDown, Award, AlertTriangle } from 'lucide-react'
import type { NerveBlocksData } from '@/lib/nerve-blocks'

function painLabel(avg: number) {
  if (avg === 0) return 'N/D'
  if (avg <= 3)  return 'Leve'
  if (avg <= 6)  return 'Moderada'
  return 'Intensa'
}

function painColor(avg: number) {
  if (avg === 0) return 'text-slate-500'
  if (avg <= 3)  return 'text-emerald-400'
  if (avg <= 6)  return 'text-yellow-400'
  return 'text-red-400'
}

export default function NerveBlocksSummary({ data }: { data: NerveBlocksData }) {
  if (data.totalBlocks === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard
        icon={<Activity size={16} />}
        label="Total de bloqueios"
        value={data.totalBlocks}
        sub={`${data.stats.length} tipo${data.stats.length !== 1 ? 's' : ''} diferentes`}
        iconBg="bg-violet-500/10"
        iconColor="text-violet-400"
        valueColor="text-violet-400"
      />
      <SummaryCard
        icon={<CheckCircle2 size={16} />}
        label="Taxa de sucesso"
        value={`${data.avgSuccessRate}%`}
        sub="média geral"
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-400"
        valueColor="text-emerald-400"
      />
      <SummaryCard
        icon={<TrendingDown size={16} />}
        label="Dor pós-op média"
        value={data.avgPain > 0 ? `${data.avgPain}/10` : 'N/D'}
        sub={painLabel(data.avgPain)}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-400"
        valueColor={painColor(data.avgPain)}
      />
      {data.bestBlock ? (
        <SummaryCard
          icon={<Award size={16} />}
          label="Melhor eficácia"
          value={data.bestBlock.block_type}
          sub={`Score ${data.bestBlock.efficacyScore}/100`}
          iconBg="bg-cyan-500/10"
          iconColor="text-cyan-400"
          valueColor="text-cyan-400"
          small
        />
      ) : (
        <SummaryCard
          icon={<AlertTriangle size={16} />}
          label="Dados insuficientes"
          value="—"
          sub="registre mais bloqueios"
          iconBg="bg-gray-700"
          iconColor="text-slate-500"
          valueColor="text-slate-500"
        />
      )}
    </div>
  )
}

function SummaryCard({
  icon, label, value, sub, iconBg, iconColor, valueColor, small = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  iconBg: string
  iconColor: string
  valueColor: string
  small?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4">
      <div className={`w-fit rounded-lg p-2 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className={`${small ? 'text-base' : 'text-2xl'} font-bold leading-tight ${valueColor} break-words`}>
          {value}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-600">{sub}</p>}
      </div>
    </div>
  )
}
