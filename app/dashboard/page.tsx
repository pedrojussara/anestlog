import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import {
  Activity, Stethoscope, CheckCircle2, XCircle, Wind,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getFilterOptions, type FilterPeriod } from '@/lib/dashboard'
import type { AnesthesiaType } from '@/types'

import StatCard from '@/components/dashboard/StatCard'
import SurgeriesBarChart from '@/components/dashboard/SurgeriesBarChart'
import AnesthesiaPieChart from '@/components/dashboard/AnesthesiaPieChart'
import SpecialtyBar from '@/components/dashboard/SpecialtyBar'
import DashboardFilters from '@/components/dashboard/DashboardFilters'
import ProceduresBarChart from '@/components/dashboard/ProceduresBarChart'

interface Props {
  searchParams: Promise<{
    period?: string
    specialty?: string
    anesthesia?: string
  }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const period    = (sp.period    ?? 'year')     as FilterPeriod
  const specialty = sp.specialty  ?? undefined
  const anesthesia = sp.anesthesia as AnesthesiaType | undefined

  // Also fetch procedure stats for the procedures chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [stats, filterOptions] = await Promise.all([
    getDashboardStats(supabase, user.id, period, specialty, anesthesia),
    getFilterOptions(supabase, user.id),
  ])

  // Compute procedure stats from existing data (reuse analytics logic inline)
  const { PROCEDURE_TYPES } = await import('@/lib/constants')
  const procMap: Record<string, { success: number; failure: number }> = {}
  // We need raw procedure data — fetch it
  const surgIds = (await db.from('surgeries').select('id').eq('user_id', user.id)).data?.map((s: any) => s.id) ?? []
  const { data: rawProcs } = surgIds.length > 0
    ? await db.from('procedures').select('type, status').in('surgery_id', surgIds)
    : { data: [] }
  for (const p of rawProcs ?? []) {
    if (!procMap[p.type]) procMap[p.type] = { success: 0, failure: 0 }
    procMap[p.type][p.status as 'success' | 'failure']++
  }
  const procedureStats = Object.entries(procMap)
    .map(([type, { success, failure }]) => {
      const total = success + failure
      return {
        type,
        label: PROCEDURE_TYPES.find((pt: any) => pt.value === type)?.label ?? type,
        success, failure, total,
        rate: total > 0 ? Math.round((success / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('users')
    .select('name, residency_year')
    .eq('id', user.id)
    .single() as { data: { name: string; residency_year: number | null } | null }

  const total = stats.total_procedures
  const successRate = total > 0
    ? Math.round((stats.procedures_by_status.success / total) * 100)
    : 0
  const failureRate = total > 0 ? 100 - successRate : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-100">
          Olá, {profile?.name?.split(' ')[0] ?? 'Residente'} 👋
        </h1>
        <p className="text-sm text-slate-500">
          {profile?.residency_year ? `R${profile.residency_year} — ` : ''}
          Aqui está um resumo da sua evolução
        </p>
      </div>

      {/* Filtros */}
      <Suspense>
        <DashboardFilters specialties={filterOptions.specialties} />
      </Suspense>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total de Cirurgias"
          value={stats.total_surgeries}
          subtitle="no período selecionado"
          icon={<Activity size={18} />}
          accent="cyan"
        />
        <StatCard
          title="Procedimentos"
          value={stats.total_procedures}
          subtitle={`em ${stats.total_surgeries} cirurgias`}
          icon={<Stethoscope size={18} />}
          accent="purple"
        />
        <StatCard
          title="Taxa de Sucesso"
          value={`${successRate}%`}
          subtitle={`${stats.procedures_by_status.success} realizados`}
          icon={<CheckCircle2 size={18} />}
          accent="green"
        />
        <StatCard
          title="Taxa de Falha"
          value={`${failureRate}%`}
          subtitle={`${stats.procedures_by_status.failure} falhas`}
          icon={<XCircle size={18} />}
          accent="red"
        />
      </div>

      {/* Linha de difícil acesso de via aérea */}
      {stats.difficult_airways > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-500/30
                        bg-orange-500/10 px-4 py-3 text-sm">
          <Wind size={16} className="text-orange-400 flex-shrink-0" />
          <span className="text-orange-300">
            <span className="font-semibold">{stats.difficult_airways}</span> via
            {stats.difficult_airways > 1 ? 's aéreas difíceis' : ' aérea difícil'} registrada
            {stats.difficult_airways > 1 ? 's' : ''} no período
          </span>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Barra — cirurgias por mês (ocupa 3 colunas) */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Cirurgias por Mês</h2>
            <p className="text-xs text-slate-500 mt-0.5">Volume acumulado no período</p>
          </div>
          <SurgeriesBarChart data={stats.surgeries_per_month} />
        </div>

        {/* Pizza — tipos de anestesia (ocupa 2 colunas) */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Tipos de Anestesia</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição por modalidade</p>
          </div>
          <AnesthesiaPieChart data={stats.anesthesia_type_distribution} />
        </div>
      </div>

      {/* Linha: Especialidades + Procedimentos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Por Especialidade Cirúrgica</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição relativa</p>
          </div>
          <SpecialtyBar
            data={stats.surgeries_by_specialty}
            total={stats.total_surgeries}
          />
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Procedimentos Mais Realizados</h2>
            <p className="text-xs text-slate-500 mt-0.5">Volume total por tipo</p>
          </div>
          <ProceduresBarChart data={procedureStats} />
        </div>
      </div>
    </div>
  )
}
