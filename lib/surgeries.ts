import type { AnesthesiaType } from '@/types'
import { PROCEDURE_TYPES } from './constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

export interface ProcedureRow {
  id: string
  type: string
  status: 'success' | 'failure'
  is_difficult_airway: boolean
  notes: string | null
  attempts: number | null
  patient_position: string | null
  puncture_approach: string | null
  armored_tube: boolean
  guide_wire: boolean
}

export interface SurgeryRow {
  id: string
  date: string
  specialty: string
  surgery_name: string | null
  anesthesia_types: AnesthesiaType[]
  notes: string | null
  created_at: string
  procedures: ProcedureRow[]
}

export interface SurgeriesFilter {
  search?: string
  specialty?: string
  anesthesia?: AnesthesiaType
  period?: 'week' | 'month' | 'year' | 'all'
  status?: 'success' | 'failure'
  page?: number
}

export const PAGE_SIZE = 10

function periodToDate(period: string): string | null {
  const now = new Date()
  if (period === 'week') now.setDate(now.getDate() - 7)
  else if (period === 'month') now.setMonth(now.getMonth() - 1)
  else if (period === 'year') now.setFullYear(now.getFullYear() - 1)
  else return null
  return now.toISOString().split('T')[0]
}

export async function getSurgeries(
  supabase: AnySupabaseClient,
  userId: string,
  filters: SurgeriesFilter = {}
): Promise<{ surgeries: SurgeryRow[]; total: number }> {
  const { search, specialty, anesthesia, period = 'all', status, page = 1 } = filters
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('surgeries')
    .select('id, date, specialty, surgery_name, anesthesia_types, notes, created_at, procedures(id, type, status, is_difficult_airway, notes, attempts, patient_position, puncture_approach, armored_tube, guide_wire)', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(from, to)

  if (specialty) query = query.eq('specialty', specialty)
  if (anesthesia) query = query.contains('anesthesia_types', [anesthesia])
  if (period && period !== 'all') {
    const fromDate = periodToDate(period)
    if (fromDate) query = query.gte('date', fromDate)
  }

  const { data, count, error } = await query
  if (error || !data) return { surgeries: [], total: 0 }

  let rows = data as SurgeryRow[]

  // Text search (client-side after fetch — Supabase Free não tem full-text em arrays)
  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter((s) =>
      s.specialty.toLowerCase().includes(q) ||
      (s.notes ?? '').toLowerCase().includes(q) ||
      s.procedures.some((p) =>
        getProcedureLabel(p.type).toLowerCase().includes(q)
      )
    )
  }

  // Status filter (has any procedure with given status)
  if (status) {
    rows = rows.filter((s) => s.procedures.some((p) => p.status === status))
  }

  return { surgeries: rows, total: count ?? 0 }
}

export function getProcedureLabel(type: string): string {
  return PROCEDURE_TYPES.find((p) => p.value === type)?.label ?? type
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateLong(iso: string): string {
  const date = new Date(iso + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}
