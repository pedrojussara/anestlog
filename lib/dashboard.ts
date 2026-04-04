import type { DashboardStats, AnesthesiaType } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

export type FilterPeriod = 'week' | 'month' | 'year' | 'all' | 'custom'

function periodToDate(period: FilterPeriod): string | null {
  const now = new Date()
  if (period === 'week') {
    now.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    now.setMonth(now.getMonth() - 1)
  } else if (period === 'year') {
    now.setFullYear(now.getFullYear() - 1)
  } else {
    return null
  }
  return now.toISOString().split('T')[0]
}

export async function getDashboardStats(
  supabase: AnySupabaseClient,
  userId: string,
  period: FilterPeriod = 'year',
  specialty?: string,
  anesthesiaType?: AnesthesiaType
): Promise<DashboardStats> {
  const fromDate = periodToDate(period)

  // Base query builder
  let surgeriesQuery = supabase
    .from('surgeries')
    .select('id, date, specialty, anesthesia_types')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  if (fromDate) surgeriesQuery = surgeriesQuery.gte('date', fromDate)
  if (specialty) surgeriesQuery = surgeriesQuery.eq('specialty', specialty)
  if (anesthesiaType) surgeriesQuery = surgeriesQuery.contains('anesthesia_types', [anesthesiaType])

  const { data: surgeries } = await surgeriesQuery

  if (!surgeries || surgeries.length === 0) {
    return emptyStats()
  }

  interface SurgeryRow { id: string; date: string; specialty: string; anesthesia_types: string[] }
  interface ProcedureRow { id: string; status: string; is_difficult_airway: boolean }

  const typedSurgeries = surgeries as SurgeryRow[]
  const surgeryIds = typedSurgeries.map((s) => s.id)

  const { data: proceduresRaw } = await supabase
    .from('procedures')
    .select('id, status, is_difficult_airway')
    .in('surgery_id', surgeryIds)
  const procedures = (proceduresRaw ?? []) as ProcedureRow[]

  // Surgeries per month
  const monthMap: Record<string, number> = {}
  for (const s of typedSurgeries) {
    const key = s.date.slice(0, 7) // YYYY-MM
    monthMap[key] = (monthMap[key] ?? 0) + 1
  }
  const surgeries_per_month = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: formatMonth(month), count }))

  // Specialty breakdown
  const specialtyMap: Record<string, number> = {}
  for (const s of typedSurgeries) {
    specialtyMap[s.specialty] = (specialtyMap[s.specialty] ?? 0) + 1
  }
  const surgeries_by_specialty = Object.entries(specialtyMap)
    .sort(([, a], [, b]) => b - a)
    .map(([specialty, count]) => ({ specialty, count }))

  // Anesthesia distribution (flatten arrays)
  const anesthesiaMap: Record<string, number> = {}
  for (const s of typedSurgeries) {
    for (const t of s.anesthesia_types) {
      anesthesiaMap[t] = (anesthesiaMap[t] ?? 0) + 1
    }
  }
  const anesthesia_type_distribution = Object.entries(anesthesiaMap)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type: type as AnesthesiaType, count }))

  // Procedures stats
  const successCount = procedures.filter((p) => p.status === 'success').length
  const failureCount = procedures.filter((p) => p.status === 'failure').length
  const difficultAirways = procedures.filter((p) => p.is_difficult_airway).length

  return {
    total_surgeries: typedSurgeries.length,
    total_procedures: procedures?.length ?? 0,
    procedures_by_status: { success: successCount, failure: failureCount },
    difficult_airways: difficultAirways,
    surgeries_by_specialty,
    anesthesia_type_distribution,
    surgeries_per_month,
    nerve_blocks_by_type: [],
  }
}

export async function getFilterOptions(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ specialties: string[] }> {
  const { data } = await supabase
    .from('surgeries')
    .select('specialty')
    .eq('user_id', userId)

  const rows = (data ?? []) as { specialty: string }[]
  const specialties = [...new Set(rows.map((s) => s.specialty))].sort()
  return { specialties }
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function emptyStats(): DashboardStats {
  return {
    total_surgeries: 0,
    total_procedures: 0,
    procedures_by_status: { success: 0, failure: 0 },
    difficult_airways: 0,
    surgeries_by_specialty: [],
    anesthesia_type_distribution: [],
    surgeries_per_month: [],
    nerve_blocks_by_type: [],
  }
}
