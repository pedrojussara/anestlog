// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

export interface DateRange {
  from: string
  to: string
}

export interface NeuroaxialMonthly {
  month: string
  raqui_first_rate: number | null
  peridural_first_rate: number | null
  raqui_redirection_rate: number | null
  peridural_redirection_rate: number | null
}

export interface PositionStats {
  sentado: number
  decubito: number
}

export interface PunctureStats {
  mediana: number
  paramediana: number
}

export interface RedirectionCounts {
  yes: number
  no: number
}

export interface NeuroaxialData {
  // Summaries
  raqui_total: number
  raqui_first_rate: number | null
  raqui_redirection_rate: number | null
  raqui_redirection_counts: RedirectionCounts
  peridural_total: number
  peridural_first_rate: number | null
  peridural_redirection_rate: number | null
  peridural_redirection_counts: RedirectionCounts
  // Monthly trend
  monthly: NeuroaxialMonthly[]
  // Position breakdown
  raqui_position: PositionStats
  peridural_position: PositionStats
  // Puncture approach breakdown
  raqui_puncture: PunctureStats
  peridural_puncture: PunctureStats
}

interface RawProc {
  type: string
  first_attempt_success: boolean | null
  needle_redirection: boolean | null
  patient_position: string | null
  puncture_approach: string | null
  surgery_id: string
}

function rate(values: boolean[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.filter(Boolean).length / values.length) * 100)
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    .replace('.', '').replace(' de ', ' ')
}

function positionStats(procs: RawProc[]): PositionStats {
  return {
    sentado:  procs.filter((p) => p.patient_position === 'sentado').length,
    decubito: procs.filter((p) => p.patient_position === 'decubito_lateral').length,
  }
}

export async function getNeuroaxialData(
  supabase: AnySupabaseClient,
  userId: string,
  range: DateRange,
): Promise<NeuroaxialData> {
  const emptyPos: PositionStats = { sentado: 0, decubito: 0 }
  const emptyPuncture: PunctureStats = { mediana: 0, paramediana: 0 }
  const emptyRedir: RedirectionCounts = { yes: 0, no: 0 }
  const empty: NeuroaxialData = {
    raqui_total: 0, raqui_first_rate: null, raqui_redirection_rate: null, raqui_redirection_counts: emptyRedir,
    peridural_total: 0, peridural_first_rate: null, peridural_redirection_rate: null, peridural_redirection_counts: emptyRedir,
    monthly: [],
    raqui_position: emptyPos, peridural_position: emptyPos,
    raqui_puncture: emptyPuncture, peridural_puncture: emptyPuncture,
  }

  // Fetch surgeries in range for date mapping
  const { data: surgeriesRaw } = await supabase
    .from('surgeries')
    .select('id, date')
    .eq('user_id', userId)
    .gte('date', range.from)
    .lte('date', range.to)

  const surgeries = (surgeriesRaw ?? []) as { id: string; date: string }[]
  const surgIds   = surgeries.map((s) => s.id)
  const dateMap   = new Map(surgeries.map((s) => [s.id, s.date]))

  if (surgIds.length === 0) return empty

  // Fetch neuroaxial procedures
  const { data: procsRaw } = await supabase
    .from('procedures')
    .select('type, first_attempt_success, needle_redirection, patient_position, puncture_approach, surgery_id')
    .in('surgery_id', surgIds)
    .in('type', ['raquidiana', 'peridural'])

  const procs: RawProc[] = procsRaw ?? []
  if (procs.length === 0) return empty

  const raquiProcs     = procs.filter((p) => p.type === 'raquidiana')
  const periduralProcs = procs.filter((p) => p.type === 'peridural')

  const isBool = (v: boolean | null): v is boolean => v != null

  const raquiFirst     = raquiProcs.map((p) => p.first_attempt_success).filter(isBool)
  const periduralFirst = periduralProcs.map((p) => p.first_attempt_success).filter(isBool)
  const raquiRedir     = raquiProcs.map((p) => p.needle_redirection).filter(isBool)
  const periduralRedir = periduralProcs.map((p) => p.needle_redirection).filter(isBool)

  // Monthly grouping
  const monthlyMap = new Map<string, {
    raquiFirst: boolean[]; periduralFirst: boolean[]; raquiRedir: boolean[]; periduralRedir: boolean[]
  }>()
  for (const proc of procs) {
    const date = dateMap.get(proc.surgery_id)
    if (!date) continue
    const yyyymm = date.slice(0, 7)
    if (!monthlyMap.has(yyyymm)) {
      monthlyMap.set(yyyymm, { raquiFirst: [], periduralFirst: [], raquiRedir: [], periduralRedir: [] })
    }
    const entry = monthlyMap.get(yyyymm)!
    if (proc.type === 'raquidiana') {
      if (proc.first_attempt_success != null) entry.raquiFirst.push(proc.first_attempt_success)
      if (proc.needle_redirection != null) entry.raquiRedir.push(proc.needle_redirection)
    } else {
      if (proc.first_attempt_success != null) entry.periduralFirst.push(proc.first_attempt_success)
      if (proc.needle_redirection != null) entry.periduralRedir.push(proc.needle_redirection)
    }
  }

  const monthly: NeuroaxialMonthly[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yyyymm, { raquiFirst: rf, periduralFirst: pf, raquiRedir: rr, periduralRedir: pr }]) => ({
      month:                      monthLabel(yyyymm),
      raqui_first_rate:           rate(rf),
      peridural_first_rate:       rate(pf),
      raqui_redirection_rate:     rate(rr),
      peridural_redirection_rate: rate(pr),
    }))

  // Position stats per type
  const raquiPos     = positionStats(raquiProcs)
  const periduralPos = positionStats(periduralProcs)

  // Puncture approach stats
  const raquiPuncture: PunctureStats = {
    mediana:     raquiProcs.filter((p) => p.puncture_approach === 'mediana').length,
    paramediana: raquiProcs.filter((p) => p.puncture_approach === 'paramediana').length,
  }
  const periduralPuncture: PunctureStats = {
    mediana:     periduralProcs.filter((p) => p.puncture_approach === 'mediana').length,
    paramediana: periduralProcs.filter((p) => p.puncture_approach === 'paramediana').length,
  }

  const raquiRedirYes     = raquiRedir.filter(Boolean).length
  const periduralRedirYes = periduralRedir.filter(Boolean).length

  return {
    raqui_total:                raquiProcs.length,
    raqui_first_rate:           rate(raquiFirst),
    raqui_redirection_rate:     rate(raquiRedir),
    raqui_redirection_counts:   { yes: raquiRedirYes, no: raquiRedir.length - raquiRedirYes },
    peridural_total:            periduralProcs.length,
    peridural_first_rate:       rate(periduralFirst),
    peridural_redirection_rate: rate(periduralRedir),
    peridural_redirection_counts: { yes: periduralRedirYes, no: periduralRedir.length - periduralRedirYes },
    monthly,
    raqui_position:     raquiPos,
    peridural_position: periduralPos,
    raqui_puncture:     raquiPuncture,
    peridural_puncture: periduralPuncture,
  }
}
