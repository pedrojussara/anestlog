import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsData, buildDateRange } from '@/lib/analytics'
import { getNeuroaxialData } from '@/lib/neuroaxial-analytics'

import PeriodFilter from '@/components/analytics/PeriodFilter'
import ChartCard from '@/components/analytics/ChartCard'
import SpecialtiesChart from '@/components/analytics/SpecialtiesChart'
import AnesthesiaDonut from '@/components/analytics/AnesthesiaDonut'
import AnesthesiaLineChart from '@/components/analytics/AnesthesiaLineChart'
import ProceduresChart from '@/components/analytics/ProceduresChart'
import IntubationSection from '@/components/analytics/IntubationSection'
import NeuroaxialSection from '@/components/analytics/NeuroaxialSection'

interface Props {
  searchParams: Promise<{
    period?: string
    from?: string
    to?: string
  }>
}

export default async function GraficosPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const period = (sp.period ?? 'year') as 'week' | 'month' | 'year' | 'custom'
  const range  = buildDateRange(period, sp.from, sp.to)

  const [data, neuroaxialData] = await Promise.all([
    getAnalyticsData(supabase, user.id, range),
    getNeuroaxialData(supabase, user.id, range),
  ])

  const totalAnesthesiaUses = data.anesthesiaDistribution.reduce((s, d) => s + d.count, 0)

  // Human-readable period label
  const periodLabel = period === 'custom'
    ? `${formatDateBR(range.from)} – ${formatDateBR(range.to)}`
    : ({ week: 'Últimos 7 dias', month: 'Último mês', year: 'Último ano' })[period]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-100">Gráficos Detalhados</h1>
        <p className="text-xs text-slate-500">
          {data.totalSurgeries} cirurgia{data.totalSurgeries !== 1 ? 's' : ''} · {data.totalProcedures} procedimento{data.totalProcedures !== 1 ? 's' : ''} · {periodLabel}
        </p>
      </div>

      {/* Filtro de período */}
      <Suspense>
        <PeriodFilter />
      </Suspense>

      {/* ── Seção 1: Especialidades ── */}
      <Section label="1" title="Especialidades Cirúrgicas">
        <ChartCard
          title="Ranking de especialidades"
          subtitle="Total de cirurgias por especialidade no período"
          action={
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400">
              {data.specialtyRanking.length} especialidade{data.specialtyRanking.length !== 1 ? 's' : ''}
            </span>
          }
        >
          <SpecialtiesChart data={data.specialtyRanking} />
        </ChartCard>
      </Section>

      {/* ── Seção 2: Anestesia ── */}
      <Section label="2" title="Tipos de Anestesia">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <ChartCard
            title="Distribuição"
            subtitle="Proporção de cada modalidade"
            className="lg:col-span-2"
          >
            <AnesthesiaDonut
              data={data.anesthesiaDistribution}
              total={totalAnesthesiaUses}
            />
          </ChartCard>

          <ChartCard
            title="Evolução temporal"
            subtitle="Modalidades utilizadas por mês"
            className="lg:col-span-3"
          >
            <AnesthesiaLineChart
              data={data.anesthesiaEvolution}
              keys={data.anesthesiaEvoKeys}
            />
          </ChartCard>
        </div>
      </Section>

      {/* ── Seção 3: Procedimentos ── */}
      <Section label="3" title="Procedimentos">
        <ChartCard
          title="Volume e taxa de sucesso por procedimento"
          subtitle="Barras empilhadas (sucesso / falha) — alterne para ver taxa"
        >
          <ProceduresChart data={data.procedureStats} />
        </ChartCard>
      </Section>

      {/* ── Seção 4: Intubação ── */}
      <Section label="4" title="Intubações">
        <ChartCard
          title="Análise de intubações"
          subtitle="Via aérea difícil, taxa de sucesso e distribuição"
        >
          <IntubationSection data={data.intubation} />
        </ChartCard>
      </Section>

      {/* ── Seção 5: Raquianestesia & Peridural ── */}
      <Section label="5" title="Raquianestesia & Peridural">
        <NeuroaxialSection data={neuroaxialData} />
      </Section>
    </div>
  )
}

function Section({
  label, title, children,
}: {
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-400">
          {label}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </h2>
        <div className="flex-1 border-t border-gray-800" />
      </div>
      {children}
    </section>
  )
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
