import type { AnesthesiaType } from '@/types'
import { ANESTHESIA_LABELS, ANESTHESIA_COLORS } from './anesthesia'
import { PROCEDURE_TYPES } from './constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

export type DateRange = { from: string; to: string }

export function buildDateRange(
  period: 'week' | 'month' | 'year' | 'custom',
  customFrom?: string,
  customTo?: string
): DateRange {
  const today = new Date()
  const to = today.toISOString().split('T')[0]

  if (period === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo }
  }
  const from = new Date(today)
  if (period === 'week')  from.setDate(today.getDate() - 7)
  if (period === 'month') from.setMonth(today.getMonth() - 1)
  if (period === 'year')  from.setFullYear(today.getFullYear() - 1)
  return { from: from.toISOString().split('T')[0], to }
}

// ── Row shapes ──────────────────────────────────────────────
interface SurgeryAnalyticsRow {
  id: string
  date: string
  specialty: string
  anesthesia_types: string[]
}
interface ProcedureAnalyticsRow {
  id: string
  surgery_id: string
  type: string
  status: 'success' | 'failure'
  is_difficult_airway: boolean
}

// ── Return types ─────────────────────────────────────────────
export interface SpecialtyRankEntry { specialty: string; count: number }

export interface AnesthesiaDistEntry {
  type: AnesthesiaType
  label: string
  count: number
  color: string
}

export interface AnesthesiaEvoEntry {
  month: string
  [type: string]: number | string
}

export interface ProcedureStatsEntry {
  type: string
  label: string
  success: number
  failure: number
  total: number
  rate: number
}

export interface IntubationStats {
  total: number
  difficult: number
  normal: number
  successCount: number
  failureCount: number
  successRate: number
}

export interface AnalyticsData {
  specialtyRanking: SpecialtyRankEntry[]
  anesthesiaDistribution: AnesthesiaDistEntry[]
  anesthesiaEvolution: AnesthesiaEvoEntry[]
  anesthesiaEvoKeys: string[]            // which types appear in the evo data
  procedureStats: ProcedureStatsEntry[]
  intubation: IntubationStats
  totalSurgeries: number
  totalProcedures: number
  dateRange: DateRange
}

// ── Main fetch ───────────────────────────────────────────────
export async function getAnalyticsData(
  supabase: AnySupabaseClient,
  userId: string,
  range: DateRange
): Promise<AnalyticsData> {
  const [{ data: surgeriesRaw }, { data: proceduresRaw }] = await Promise.all([
    supabase
      .from('surgeries')
      .select('id, date, specialty, anesthesia_types')
      .eq('user_id', userId)
      .gte('date', range.from)
      .lte('date', range.to)
      .order('date', { ascending: true }),
    supabase
      .from('procedures')
      .select('id, surgery_id, type, status, is_difficult_airway')
      .in(
        'surgery_id',
        // sub-query not available — we'll filter after
        (
          await supabase
            .from('surgeries')
            .select('id')
            .eq('user_id', userId)
            .gte('date', range.from)
            .lte('date', range.to)
        ).data?.map((s: { id: string }) => s.id) ?? []
      ),
  ])

  const surgeries: SurgeryAnalyticsRow[] = surgeriesRaw ?? []
  const procedures: ProcedureAnalyticsRow[] = proceduresRaw ?? []

  // ── 1. Specialty ranking ─────────────────────────────────
  const specMap: Record<string, number> = {}
  for (const s of surgeries) {
    specMap[s.specialty] = (specMap[s.specialty] ?? 0) + 1
  }
  const specialtyRanking = Object.entries(specMap)
    .map(([specialty, count]) => ({ specialty, count }))
    .sort((a, b) => b.count - a.count)

  // ── 2. Anesthesia distribution ───────────────────────────
  const anesMap: Record<string, number> = {}
  for (const s of surgeries) {
    for (const t of s.anesthesia_types) {
      anesMap[t] = (anesMap[t] ?? 0) + 1
    }
  }
  const anesthesiaDistribution: AnesthesiaDistEntry[] = Object.entries(anesMap)
    .map(([type, count]) => ({
      type: type as AnesthesiaType,
      label: ANESTHESIA_LABELS[type as AnesthesiaType] ?? type,
      count,
      color: ANESTHESIA_COLORS[type as AnesthesiaType] ?? '#64748b',
    }))
    .sort((a, b) => b.count - a.count)

  // ── 3. Anesthesia evolution (per month) ──────────────────
  // Pivot: { month → { anesthesiaType → count } }
  const evoMap: Record<string, Record<string, number>> = {}
  for (const s of surgeries) {
    const month = s.date.slice(0, 7)
    if (!evoMap[month]) evoMap[month] = {}
    for (const t of s.anesthesia_types) {
      evoMap[month][t] = (evoMap[month][t] ?? 0) + 1
    }
  }
  const evoTypes = [...new Set(surgeries.flatMap((s) => s.anesthesia_types))]
  const anesthesiaEvolution: AnesthesiaEvoEntry[] = Object.entries(evoMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => {
      const entry: AnesthesiaEvoEntry = { month: formatMonth(month) }
      for (const t of evoTypes) entry[t] = counts[t] ?? 0
      return entry
    })
  const anesthesiaEvoKeys = evoTypes

  // ── 4. Procedure stats ───────────────────────────────────
  const procMap: Record<string, { success: number; failure: number }> = {}
  for (const p of procedures) {
    if (!procMap[p.type]) procMap[p.type] = { success: 0, failure: 0 }
    procMap[p.type][p.status]++
  }
  const procedureStats: ProcedureStatsEntry[] = Object.entries(procMap)
    .map(([type, { success, failure }]) => {
      const total = success + failure
      return {
        type,
        label: PROCEDURE_TYPES.find((pt) => pt.value === type)?.label ?? type,
        success,
        failure,
        total,
        rate: total > 0 ? Math.round((success / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  // ── 5. Intubation stats ──────────────────────────────────
  const intubationProcs = procedures.filter(
    (p) => p.type === 'intubacao_orotraqueal' || p.type === 'intubacao_nasotraqueal'
  )
  const difficult   = intubationProcs.filter((p) => p.is_difficult_airway).length
  const intSuccess  = intubationProcs.filter((p) => p.status === 'success').length
  const intTotal    = intubationProcs.length
  const intubation: IntubationStats = {
    total: intTotal,
    difficult,
    normal: intTotal - difficult,
    successCount: intSuccess,
    failureCount: intTotal - intSuccess,
    successRate: intTotal > 0 ? Math.round((intSuccess / intTotal) * 100) : 0,
  }

  return {
    specialtyRanking,
    anesthesiaDistribution,
    anesthesiaEvolution,
    anesthesiaEvoKeys,
    procedureStats,
    intubation,
    totalSurgeries: surgeries.length,
    totalProcedures: procedures.length,
    dateRange: range,
  }
}

function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', {
    month: 'short', year: '2-digit',
  })
}
