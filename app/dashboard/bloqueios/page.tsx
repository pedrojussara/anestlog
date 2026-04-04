import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { PlusCircle, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buildDateRange } from '@/lib/analytics'
import { getNerveBlocksData } from '@/lib/nerve-blocks'

import PeriodFilter from '@/components/analytics/PeriodFilter'
import ChartCard from '@/components/analytics/ChartCard'
import NerveBlocksSummary from '@/components/nerve-blocks/NerveBlocksSummary'
import BlockRankingChart from '@/components/nerve-blocks/BlockRankingChart'
import PainLevelChart from '@/components/nerve-blocks/PainLevelChart'
import SuccessRateChart from '@/components/nerve-blocks/SuccessRateChart'
import EfficacyScatter from '@/components/nerve-blocks/EfficacyScatter'
import PainDistribution from '@/components/nerve-blocks/PainDistribution'
import BlockEvolutionChart from '@/components/nerve-blocks/BlockEvolutionChart'

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

export default async function BloqueiosPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const period = (sp.period ?? 'year') as 'week' | 'month' | 'year' | 'custom'
  const range  = buildDateRange(period, sp.from, sp.to)

  const data = await getNerveBlocksData(supabase, user.id, range)

  const periodLabel = period === 'custom'
    ? `${fmt(range.from)} – ${fmt(range.to)}`
    : ({ week: 'Últimos 7 dias', month: 'Último mês', year: 'Último ano' })[period]

  const isEmpty = data.totalBlocks === 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-violet-500/10 p-1.5">
              <Zap size={16} className="text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Bloqueios Periféricos</h1>
          </div>
          <p className="text-xs text-slate-500">
            {isEmpty
              ? 'Nenhum bloqueio registrado no período'
              : `${data.totalBlocks} bloqueio${data.totalBlocks !== 1 ? 's' : ''} · ${data.stats.length} tipo${data.stats.length !== 1 ? 's' : ''} · ${periodLabel}`}
          </p>
        </div>
        <Link
          href="/dashboard/cirurgias/nova"
          className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5
                     text-sm font-semibold text-white hover:bg-violet-400 transition-colors"
        >
          <PlusCircle size={15} />
          <span className="hidden sm:inline">Registrar</span>
        </Link>
      </div>

      {/* Filtro de período */}
      <Suspense>
        <PeriodFilter />
      </Suspense>

      {/* Empty state */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary cards */}
          <NerveBlocksSummary data={data} />

          {/* ── Linha 1: Ranking + Evolução ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <ChartCard
              title="Ranking por volume"
              subtitle="Tipos mais realizados no período"
              className="lg:col-span-2"
            >
              <BlockRankingChart data={data.stats} />
            </ChartCard>

            <ChartCard
              title="Evolução temporal"
              subtitle="Bloqueios realizados por mês"
              className="lg:col-span-3"
            >
              <BlockEvolutionChart
                data={data.evolutionByMonth}
                keys={data.evolutionKeys}
              />
            </ChartCard>
          </div>

          {/* ── Linha 2: Dor + Sucesso ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Dor pós-operatória por bloqueio"
              subtitle="Média de dor (0–10) — menor é melhor. Linhas: limiar leve (3) e moderado (6)"
            >
              <PainLevelChart data={data.stats} />
            </ChartCard>

            <ChartCard
              title="Taxa de sucesso por tipo"
              subtitle="Proporção de bloqueios bem-sucedidos"
            >
              <SuccessRateChart data={data.stats} />
            </ChartCard>
          </div>

          {/* ── Linha 3: Eficácia + Distribuição de dor ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              title="Gráfico de eficácia combinada"
              subtitle="Eixo X = taxa de sucesso · Eixo Y = ausência de dor · Tamanho = volume"
              className="lg:col-span-2"
            >
              <EfficacyScatter data={data.stats} />
            </ChartCard>

            <ChartCard
              title="Distribuição de dor pós-op"
              subtitle="Classificação por faixa de intensidade"
            >
              <PainDistribution data={data.painDistribution} />

              {/* Best / worst highlight */}
              {data.bestBlock && (
                <div className="mt-4 flex flex-col gap-2 border-t border-gray-700/60 pt-4">
                  <BlockHighlight
                    label="Melhor eficácia"
                    block={data.bestBlock.block_type}
                    score={data.bestBlock.efficacyScore}
                    color="text-emerald-400"
                    borderColor="border-emerald-500/20"
                    bgColor="bg-emerald-500/5"
                  />
                  {data.worstBlock && data.worstBlock.block_type !== data.bestBlock.block_type && (
                    <BlockHighlight
                      label="Menor eficácia"
                      block={data.worstBlock.block_type}
                      score={data.worstBlock.efficacyScore}
                      color="text-red-400"
                      borderColor="border-red-500/20"
                      bgColor="bg-red-500/5"
                    />
                  )}
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}

function BlockHighlight({
  label, block, score, color, borderColor, bgColor,
}: {
  label: string; block: string; score: number
  color: string; borderColor: string; bgColor: string
}) {
  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} px-3 py-2 text-xs`}>
      <p className="text-slate-500">{label}</p>
      <p className={`font-semibold ${color} truncate`}>{block}</p>
      <p className="text-slate-600">Score {score}/100</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border
                    border-dashed border-gray-700 bg-gray-800/40 py-20 text-center">
      <div className="rounded-2xl bg-gray-800 p-4">
        <Zap size={28} className="text-slate-600" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-400">Nenhum bloqueio registrado</p>
        <p className="text-xs text-slate-600">
          Registre cirurgias com procedimentos de bloqueio periférico para ver as análises
        </p>
      </div>
      <Link
        href="/dashboard/cirurgias/nova"
        className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5
                   text-sm font-semibold text-white hover:bg-violet-400 transition-colors"
      >
        <PlusCircle size={15} />
        Registrar primeira cirurgia
      </Link>
    </div>
  )
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
