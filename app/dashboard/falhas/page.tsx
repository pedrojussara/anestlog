import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buildDateRange } from '@/lib/analytics'
import { getFailuresData } from '@/lib/failures'

import PeriodFilter from '@/components/analytics/PeriodFilter'
import ChartCard from '@/components/analytics/ChartCard'
import FailuresSummary from '@/components/failures/FailuresSummary'
import AttentionAlerts from '@/components/failures/AttentionAlerts'
import FailuresByTypeChart from '@/components/failures/FailuresByTypeChart'
import FailureTrendChart from '@/components/failures/FailureTrendChart'
import FailureList from '@/components/failures/FailureList'

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

export default async function FalhasPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const period = (sp.period ?? 'year') as 'week' | 'month' | 'year' | 'custom'
  const range  = buildDateRange(period, sp.from, sp.to)

  const data = await getFailuresData(supabase, user.id, range)

  const periodLabel = period === 'custom'
    ? `${fmt(range.from)} – ${fmt(range.to)}`
    : ({ week: 'Últimos 7 dias', month: 'Último mês', year: 'Último ano' })[period]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-red-500/10 p-1.5">
          <XCircle size={16} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Análise de Falhas</h1>
          <p className="text-xs text-slate-500">
            {data.totalFailures > 0
              ? `${data.totalFailures} falha${data.totalFailures > 1 ? 's' : ''} · ${data.overallRate}% de taxa geral · ${periodLabel}`
              : `Nenhuma falha registrada · ${periodLabel}`}
          </p>
        </div>
      </div>

      {/* Filtro de período */}
      <Suspense>
        <PeriodFilter />
      </Suspense>

      {/* Cards de resumo */}
      <FailuresSummary data={data} />

      {/* Alertas de atenção */}
      <AttentionAlerts types={data.attentionTypes} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Falhas por tipo de procedimento"
          subtitle="Volume total de falhas — vermelho = crítico (≥ 30%), amarelo = atenção (≥ 15%)"
        >
          <FailuresByTypeChart data={data.byType} />
        </ChartCard>

        <ChartCard
          title="Tendência de falhas ao longo do tempo"
          subtitle="Contagem absoluta ou taxa percentual por mês"
        >
          <FailureTrendChart data={data.trend} />
        </ChartCard>
      </div>

      {/* Lista cronológica */}
      <ChartCard
        title="Registro cronológico de falhas"
        subtitle="Clique em cada item para ver as observações do procedimento"
        action={
          data.totalFailures > 0 ? (
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
              {data.totalFailures} total
            </span>
          ) : undefined
        }
      >
        <FailureList failures={data.failures} />
      </ChartCard>
    </div>
  )
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
