// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

export interface DateRange {
  from: string
  to: string
}

export interface NeuroaxialMonthly {
  month: string
  raqui_avg: number | null
  peridural_avg: number | null
  raqui_first_rate: number | null
  peridural_first_rate: number | null
}

export interface AttemptsDistEntry {
  label: string   // "1", "2", "3+"
  raqui: number
  peridural: number
}

export interface PositionDistEntry {
  position: string  // "Sentado" | "Decúbito Lateral"
  value: number
}

export interface PositionStats {
  sentado: number
  decubito: number
  sentado_avg_attempts: number | null
  decubito_avg_attempts: number | null
}

export interface PosVsAttemptsEntry {
  position: string
  raqui_avg: number | null
  peridural_avg: number | null
}

export interface PunctureStats {
  mediana: number
  paramediana: number
}

export interface NeuroaxialData {
  // Summaries
  raqui_total: number
  raqui_avg_attempts: number | null
  raqui_first_rate: number | null
  peridural_total: number
  peridural_avg_attempts: number | null
  peridural_first_rate: number | null
  // Monthly trend
  monthly: NeuroaxialMonthly[]
  // Attempts distribution
  distribution: AttemptsDistEntry[]
  // Position breakdown
  raqui_position: PositionStats
  peridural_position: PositionStats
  // Position vs attempts (for cross chart)
  position_vs_attempts: PosVsAttemptsEntry[]
  // Puncture approach breakdown
  raqui_puncture: PunctureStats
  peridural_puncture: PunctureStats
}

interface RawProc {
  type: string
  attempts: number | null
  patient_position: string | null
  puncture_approach: string | null
  surgery_id: string
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

function firstRate(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.filter((v) => v === 1).length / values.length) * 100)
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    .replace('.', '').replace(' de ', ' ')
}

function positionStats(procs: RawProc[]): PositionStats {
  const sentadoProcs  = procs.filter((p) => p.patient_position === 'sentado')
  const decubitoProcs = procs.filter((p) => p.patient_position === 'decubito_lateral')
  return {
    sentado:               sentadoProcs.length,
    decubito:              decubitoProcs.length,
    sentado_avg_attempts:  avg(sentadoProcs.map((p) => p.attempts ?? 1)),
    decubito_avg_attempts: avg(decubitoProcs.map((p) => p.attempts ?? 1)),
  }
}

export async function getNeuroaxialData(
  supabase: AnySupabaseClient,
  userId: string,
  range: DateRange,
): Promise<NeuroaxialData> {
  const emptyPos: PositionStats = {
    sentado: 0, decubito: 0,
    sentado_avg_attempts: null, decubito_avg_attempts: null,
  }
  const emptyPuncture: PunctureStats = { mediana: 0, paramediana: 0 }
  const empty: NeuroaxialData = {
    raqui_total: 0, raqui_avg_attempts: null, raqui_first_rate: null,
    peridural_total: 0, peridural_avg_attempts: null, peridural_first_rate: null,
    monthly: [], distribution: [],
    raqui_position: emptyPos, peridural_position: emptyPos,
    position_vs_attempts: [],
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
    .select('type, attempts, patient_position, puncture_approach, surgery_id')
    .in('surgery_id', surgIds)
    .in('type', ['raquidiana', 'peridural'])

  const procs: RawProc[] = procsRaw ?? []
  if (procs.length === 0) return empty

  const raquiProcs    = procs.filter((p) => p.type === 'raquidiana')
  const periduralProcs = procs.filter((p) => p.type === 'peridural')

  const raquiAttempts    = raquiProcs.map((p) => p.attempts ?? 1)
  const periduralAttempts = periduralProcs.map((p) => p.attempts ?? 1)

  // Monthly grouping
  const monthlyMap = new Map<string, { raqui: number[]; peridural: number[] }>()
  for (const proc of procs) {
    const date = dateMap.get(proc.surgery_id)
    if (!date) continue
    const yyyymm = date.slice(0, 7)
    if (!monthlyMap.has(yyyymm)) monthlyMap.set(yyyymm, { raqui: [], peridural: [] })
    const entry = monthlyMap.get(yyyymm)!
    const a = proc.attempts ?? 1
    if (proc.type === 'raquidiana') entry.raqui.push(a)
    else entry.peridural.push(a)
  }

  const monthly: NeuroaxialMonthly[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([yyyymm, { raqui, peridural }]) => ({
      month:                monthLabel(yyyymm),
      raqui_avg:            avg(raqui),
      peridural_avg:        avg(peridural),
      raqui_first_rate:     firstRate(raqui),
      peridural_first_rate: firstRate(peridural),
    }))

  // Attempts distribution
  const buckets = ['1', '2', '3+']
  const distribution: AttemptsDistEntry[] = buckets.map((label) => ({
    label,
    raqui:    raquiAttempts.filter((a) => label === '3+' ? a >= 3 : a === Number(label)).length,
    peridural: periduralAttempts.filter((a) => label === '3+' ? a >= 3 : a === Number(label)).length,
  }))

  // Position stats per type
  const raquiPos    = positionStats(raquiProcs)
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

  // Position vs attempts cross chart
  // Sentado: avg attempts for raqui and peridural done in sentado position
  // Decúbito: same for decúbito lateral
  const position_vs_attempts: PosVsAttemptsEntry[] = [
    {
      position: 'Sentado',
      raqui_avg:    avg(raquiProcs.filter((p) => p.patient_position === 'sentado').map((p) => p.attempts ?? 1)),
      peridural_avg: avg(periduralProcs.filter((p) => p.patient_position === 'sentado').map((p) => p.attempts ?? 1)),
    },
    {
      position: 'Decúbito Lateral',
      raqui_avg:    avg(raquiProcs.filter((p) => p.patient_position === 'decubito_lateral').map((p) => p.attempts ?? 1)),
      peridural_avg: avg(periduralProcs.filter((p) => p.patient_position === 'decubito_lateral').map((p) => p.attempts ?? 1)),
    },
  ]

  return {
    raqui_total:            raquiProcs.length,
    raqui_avg_attempts:     avg(raquiAttempts),
    raqui_first_rate:       firstRate(raquiAttempts),
    peridural_total:        periduralProcs.length,
    peridural_avg_attempts: avg(periduralAttempts),
    peridural_first_rate:   firstRate(periduralAttempts),
    monthly,
    distribution,
    raqui_position:         raquiPos,
    peridural_position:     periduralPos,
    position_vs_attempts,
    raqui_puncture:         raquiPuncture,
    peridural_puncture:     periduralPuncture,
  }
}
