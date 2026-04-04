import type { DateRange } from './analytics'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

// ── Row shapes ────────────────────────────────────────────
interface NerveBlockRow {
  id: string
  procedure_id: string
  block_type: string
  postop_pain_level: number | null
}
interface ProcedureRow {
  id: string
  surgery_id: string
  status: 'success' | 'failure'
}

// ── Output types ──────────────────────────────────────────
export interface BlockStat {
  block_type: string
  total: number
  success: number
  failure: number
  successRate: number          // 0–100
  avgPain: number              // 0–10
  painSamples: number          // how many had a pain reading
  efficacyScore: number        // 0–100: blend of successRate + low pain
}

export interface NerveBlocksData {
  stats: BlockStat[]           // sorted by total desc
  totalBlocks: number
  avgSuccessRate: number
  avgPain: number
  bestBlock: BlockStat | null  // highest efficacy score
  worstBlock: BlockStat | null // lowest efficacy score
  painDistribution: { label: string; count: number; pct: number }[]
  evolutionByMonth: EvolutionEntry[]
  evolutionKeys: string[]      // block types that appear
}

export interface EvolutionEntry {
  month: string
  [blockType: string]: number | string
}

// ── Main fetch ────────────────────────────────────────────
export async function getNerveBlocksData(
  supabase: AnySupabaseClient,
  userId: string,
  range: DateRange
): Promise<NerveBlocksData> {
  // Step 1: surgeries in range
  const { data: surgeriesRaw } = await supabase
    .from('surgeries')
    .select('id, date')
    .eq('user_id', userId)
    .gte('date', range.from)
    .lte('date', range.to)

  const surgeries = (surgeriesRaw ?? []) as { id: string; date: string }[]
  if (surgeries.length === 0) return emptyData()

  const surgeryIds = surgeries.map((s) => s.id)

  // Step 2: procedures that are nerve blocks
  const { data: proceduresRaw } = await supabase
    .from('procedures')
    .select('id, surgery_id, status')
    .in('surgery_id', surgeryIds)
    .eq('type', 'bloqueio_periferico')

  const procedures = (proceduresRaw ?? []) as ProcedureRow[]
  if (procedures.length === 0) return emptyData()

  const procedureIds = procedures.map((p) => p.id)
  const procedureMap = new Map(procedures.map((p) => [p.id, p]))

  // Step 3: nerve_blocks
  const { data: blocksRaw } = await supabase
    .from('nerve_blocks')
    .select('id, procedure_id, block_type, postop_pain_level')
    .in('procedure_id', procedureIds)

  const blocks = (blocksRaw ?? []) as NerveBlockRow[]
  if (blocks.length === 0) return emptyData()

  // Build surgery date lookup
  const surgeryDateMap = new Map(surgeries.map((s) => [s.id, s.date]))

  // ── Aggregate per block type ────────────────────────────
  const typeMap = new Map<string, {
    total: number; success: number; failure: number
    painSum: number; painSamples: number
  }>()

  for (const block of blocks) {
    const proc = procedureMap.get(block.procedure_id)
    if (!proc) continue

    if (!typeMap.has(block.block_type)) {
      typeMap.set(block.block_type, { total: 0, success: 0, failure: 0, painSum: 0, painSamples: 0 })
    }
    const entry = typeMap.get(block.block_type)!
    entry.total++
    if (proc.status === 'success') entry.success++
    else entry.failure++
    if (block.postop_pain_level != null) {
      entry.painSum += block.postop_pain_level
      entry.painSamples++
    }
  }

  const stats: BlockStat[] = Array.from(typeMap.entries()).map(([block_type, v]) => {
    const successRate = v.total > 0 ? Math.round((v.success / v.total) * 100) : 0
    const avgPain = v.painSamples > 0 ? Math.round((v.painSum / v.painSamples) * 10) / 10 : 0
    // Efficacy: 60% weight on success, 40% on low pain  (pain inverted: 10-avgPain)/10
    const painScore = v.painSamples > 0 ? ((10 - avgPain) / 10) * 100 : 50
    const efficacyScore = Math.round(successRate * 0.6 + painScore * 0.4)
    return { block_type, total: v.total, success: v.success, failure: v.failure, successRate, avgPain, painSamples: v.painSamples, efficacyScore }
  }).sort((a, b) => b.total - a.total)

  // ── Global metrics ──────────────────────────────────────
  const totalBlocks = stats.reduce((s, d) => s + d.total, 0)
  const totalSuccess = stats.reduce((s, d) => s + d.success, 0)
  const avgSuccessRate = totalBlocks > 0 ? Math.round((totalSuccess / totalBlocks) * 100) : 0
  const painStats = stats.filter((s) => s.painSamples > 0)
  const avgPain = painStats.length > 0
    ? Math.round((painStats.reduce((s, d) => s + d.avgPain, 0) / painStats.length) * 10) / 10
    : 0

  const sorted = [...stats].sort((a, b) => b.efficacyScore - a.efficacyScore)
  const bestBlock  = sorted[0] ?? null
  const worstBlock = sorted[sorted.length - 1] ?? null

  // ── Pain distribution (buckets 0-3 / 4-6 / 7-10) ───────
  const buckets = { low: 0, mid: 0, high: 0, none: 0 }
  for (const block of blocks) {
    const lvl = block.postop_pain_level
    if (lvl == null) { buckets.none++; continue }
    if (lvl <= 3) buckets.low++
    else if (lvl <= 6) buckets.mid++
    else buckets.high++
  }
  const painTotal = blocks.length
  const painDistribution = [
    { label: 'Leve (0–3)',    count: buckets.low,  pct: pct(buckets.low,  painTotal) },
    { label: 'Moderada (4–6)', count: buckets.mid,  pct: pct(buckets.mid,  painTotal) },
    { label: 'Intensa (7–10)', count: buckets.high, pct: pct(buckets.high, painTotal) },
    { label: 'Não informada', count: buckets.none, pct: pct(buckets.none, painTotal) },
  ]

  // ── Evolution by month ───────────────────────────────────
  const evoMap: Record<string, Record<string, number>> = {}
  for (const block of blocks) {
    const proc = procedureMap.get(block.procedure_id)
    if (!proc) continue
    const date = surgeryDateMap.get(proc.surgery_id)
    if (!date) continue
    const month = date.slice(0, 7)
    if (!evoMap[month]) evoMap[month] = {}
    evoMap[month][block.block_type] = (evoMap[month][block.block_type] ?? 0) + 1
  }

  const evoKeys = [...new Set(blocks.map((b) => b.block_type))]
  const evolutionByMonth: EvolutionEntry[] = Object.entries(evoMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => {
      const entry: EvolutionEntry = { month: formatMonth(month) }
      for (const k of evoKeys) entry[k] = counts[k] ?? 0
      return entry
    })

  return {
    stats,
    totalBlocks,
    avgSuccessRate,
    avgPain,
    bestBlock,
    worstBlock,
    painDistribution,
    evolutionByMonth,
    evolutionKeys: evoKeys,
  }
}

// ── Helpers ───────────────────────────────────────────────
function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0
}

function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', {
    month: 'short', year: '2-digit',
  })
}

function emptyData(): NerveBlocksData {
  return {
    stats: [], totalBlocks: 0, avgSuccessRate: 0, avgPain: 0,
    bestBlock: null, worstBlock: null,
    painDistribution: [], evolutionByMonth: [], evolutionKeys: [],
  }
}
