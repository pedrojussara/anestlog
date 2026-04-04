import { PROCEDURE_TYPES } from './constants'
import type { DateRange } from './analytics'
import type { AnesthesiaType } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

// ── Output types ──────────────────────────────────────────

export interface FailureItem {
  id: string
  type: string
  label: string
  notes: string | null
  is_difficult_airway: boolean
  surgery_id: string
  surgery_date: string
  surgery_specialty: string
  surgery_anesthesia_types: AnesthesiaType[]
}

export interface FailureByType {
  type: string
  label: string
  failureCount: number
  totalCount: number
  failureRate: number            // 0–100
  needsAttention: boolean        // rate ≥ 30% AND count ≥ 2
}

export interface FailureTrendEntry {
  month: string
  failures: number
  total: number
  rate: number                   // 0–100, rounded
}

export interface FailuresData {
  failures: FailureItem[]        // chronological desc
  byType: FailureByType[]        // sorted by failureCount desc
  trend: FailureTrendEntry[]
  totalFailures: number
  totalProcedures: number
  overallRate: number
  attentionTypes: FailureByType[]  // needs improvement
}

// ── Fetch ─────────────────────────────────────────────────

export async function getFailuresData(
  supabase: AnySupabaseClient,
  userId: string,
  range: DateRange
): Promise<FailuresData> {
  // Step 1: surgeries in range
  const { data: surgeriesRaw } = await supabase
    .from('surgeries')
    .select('id, date, specialty, anesthesia_types')
    .eq('user_id', userId)
    .gte('date', range.from)
    .lte('date', range.to)
    .order('date', { ascending: false })

  const surgeries = (surgeriesRaw ?? []) as {
    id: string; date: string; specialty: string; anesthesia_types: AnesthesiaType[]
  }[]

  if (surgeries.length === 0) return emptyData()

  const surgeryIds = surgeries.map((s) => s.id)
  const surgeryMap = new Map(surgeries.map((s) => [s.id, s]))

  // Step 2: all procedures in those surgeries
  const { data: proceduresRaw } = await supabase
    .from('procedures')
    .select('id, surgery_id, type, status, is_difficult_airway, notes')
    .in('surgery_id', surgeryIds)

  const procedures = (proceduresRaw ?? []) as {
    id: string; surgery_id: string; type: string
    status: 'success' | 'failure'; is_difficult_airway: boolean; notes: string | null
  }[]

  if (procedures.length === 0) return emptyData()

  // ── Build failure items ───────────────────────────────
  const failures: FailureItem[] = procedures
    .filter((p) => p.status === 'failure')
    .map((p) => {
      const s = surgeryMap.get(p.surgery_id)!
      return {
        id: p.id,
        type: p.type,
        label: PROCEDURE_TYPES.find((pt) => pt.value === p.type)?.label ?? p.type,
        notes: p.notes,
        is_difficult_airway: p.is_difficult_airway,
        surgery_id: p.surgery_id,
        surgery_date: s.date,
        surgery_specialty: s.specialty,
        surgery_anesthesia_types: s.anesthesia_types,
      }
    })
    .sort((a, b) => b.surgery_date.localeCompare(a.surgery_date))

  // ── By type stats ─────────────────────────────────────
  const typeMap = new Map<string, { fail: number; total: number }>()
  for (const p of procedures) {
    if (!typeMap.has(p.type)) typeMap.set(p.type, { fail: 0, total: 0 })
    const entry = typeMap.get(p.type)!
    entry.total++
    if (p.status === 'failure') entry.fail++
  }

  const byType: FailureByType[] = Array.from(typeMap.entries())
    .map(([type, { fail, total }]) => {
      const rate = total > 0 ? Math.round((fail / total) * 100) : 0
      return {
        type,
        label: PROCEDURE_TYPES.find((pt) => pt.value === type)?.label ?? type,
        failureCount: fail,
        totalCount: total,
        failureRate: rate,
        needsAttention: rate >= 30 && fail >= 2,
      }
    })
    .sort((a, b) => b.failureCount - a.failureCount)

  // ── Trend by month ────────────────────────────────────
  // Build month buckets from surgeries
  const monthBuckets = new Map<string, { fail: number; total: number }>()
  for (const s of surgeries) {
    const key = s.date.slice(0, 7)
    if (!monthBuckets.has(key)) monthBuckets.set(key, { fail: 0, total: 0 })
  }
  for (const p of procedures) {
    const s = surgeryMap.get(p.surgery_id)
    if (!s) continue
    const key = s.date.slice(0, 7)
    const bucket = monthBuckets.get(key)
    if (!bucket) continue
    bucket.total++
    if (p.status === 'failure') bucket.fail++
  }

  const trend: FailureTrendEntry[] = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { fail, total }]) => ({
      month: formatMonth(month),
      failures: fail,
      total,
      rate: total > 0 ? Math.round((fail / total) * 100) : 0,
    }))

  // ── Globals ───────────────────────────────────────────
  const totalFailures    = failures.length
  const totalProcedures  = procedures.length
  const overallRate = totalProcedures > 0
    ? Math.round((totalFailures / totalProcedures) * 100)
    : 0

  const attentionTypes = byType.filter((t) => t.needsAttention)

  return { failures, byType, trend, totalFailures, totalProcedures, overallRate, attentionTypes }
}

// ── Helpers ───────────────────────────────────────────────
function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', {
    month: 'short', year: '2-digit',
  })
}

function emptyData(): FailuresData {
  return {
    failures: [], byType: [], trend: [],
    totalFailures: 0, totalProcedures: 0, overallRate: 0, attentionTypes: [],
  }
}
