import { redirect } from 'next/navigation'
import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PROCEDURE_TYPES } from '@/lib/constants'
import GoalsClient from './GoalsClient'

interface GoalRow {
  procedure_type: string
  target_count: number
  deadline: string | null
  created_at: string
  block_type: string | null
}

interface ProcedureCount {
  type: string
  count: number
}

export default async function MetasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Goals
  const { data: goalsRaw } = await db
    .from('goals')
    .select('procedure_type, target_count, deadline, created_at, block_type')
    .eq('user_id', user.id)
  const goals = (goalsRaw ?? []) as GoalRow[]

  // Surgery IDs for this user
  const { data: surgeriesRaw } = await db.from('surgeries').select('id').eq('user_id', user.id)
  const surgIds = (surgeriesRaw ?? []).map((s: any) => s.id)

  // Procedure counts (all time, non-block)
  const procCounts: ProcedureCount[] = []
  if (surgIds.length > 0) {
    const { data: procsRaw } = await db
      .from('procedures')
      .select('type')
      .in('surgery_id', surgIds)
      .eq('status', 'success')

    const countMap: Record<string, number> = {}
    for (const p of procsRaw ?? []) {
      countMap[p.type] = (countMap[p.type] ?? 0) + 1
    }
    for (const [type, count] of Object.entries(countMap)) {
      procCounts.push({ type, count })
    }
  }

  // Nerve block counts by block_type (for bloqueio_periferico goals)
  const blockTypeCounts: Record<string, number> = {}
  if (surgIds.length > 0) {
    const { data: blockProcsRaw } = await db
      .from('procedures')
      .select('id')
      .in('surgery_id', surgIds)
      .eq('type', 'bloqueio_periferico')
      .eq('status', 'success')

    const blockProcIds = (blockProcsRaw ?? []).map((p: any) => p.id)

    if (blockProcIds.length > 0) {
      const { data: nerveBlocksRaw } = await db
        .from('nerve_blocks')
        .select('block_type')
        .in('procedure_id', blockProcIds)

      for (const nb of nerveBlocksRaw ?? []) {
        blockTypeCounts[nb.block_type] = (blockTypeCounts[nb.block_type] ?? 0) + 1
      }
    }
  }

  // Build goal items with progress
  const procedureLabels = Object.fromEntries(
    PROCEDURE_TYPES.map((p) => [p.value, p.label])
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const goalItems = goals.map((g) => {
    // Count: nerve-block goals use blockTypeCounts, others use procCounts
    const done = g.procedure_type === 'bloqueio_periferico' && g.block_type
      ? blockTypeCounts[g.block_type] ?? 0
      : procCounts.find((p) => p.type === g.procedure_type)?.count ?? 0

    const pct       = Math.min(100, Math.round((done / g.target_count) * 100))
    const remaining = Math.max(0, g.target_count - done)

    // Label
    const baseLabel = procedureLabels[g.procedure_type] ?? g.procedure_type
    const label     = g.block_type ? `${baseLabel} — ${g.block_type}` : baseLabel

    // Deadline calculations
    let daysLeft: number | null = null
    let neededPerWeek: number | null = null
    let deadlineStatus: 'expired' | 'on_track' | 'behind' | null = null

    if (g.deadline && pct < 100) {
      const deadlineDate = new Date(g.deadline + 'T00:00:00')
      const startDate    = new Date(g.created_at)
      startDate.setHours(0, 0, 0, 0)

      daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLeft < 0) {
        deadlineStatus = 'expired'
      } else {
        const totalDays   = Math.max(1, Math.ceil((deadlineDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        const elapsedDays = Math.max(0, totalDays - daysLeft)
        const expectedPct = Math.round((elapsedDays / totalDays) * 100)
        deadlineStatus    = pct >= expectedPct ? 'on_track' : 'behind'
        const weeksLeft   = daysLeft / 7
        neededPerWeek     = weeksLeft > 0 ? Math.ceil(remaining / weeksLeft) : remaining
      }
    }

    return {
      procedure_type: g.procedure_type,
      block_type:     g.block_type ?? null,
      label,
      target:         g.target_count,
      done,
      pct,
      remaining,
      status:         pct >= 100 ? 'done' : pct >= 70 ? 'near' : 'far',
      deadline:       g.deadline ?? null,
      daysLeft,
      neededPerWeek,
      deadlineStatus,
    } as const
  }).sort((a, b) => b.pct - a.pct)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-amber-500/10 p-1.5">
          <Target size={16} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Metas de Procedimentos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {goalItems.length > 0
              ? `${goalItems.filter((g) => g.status === 'done').length}/${goalItems.length} meta${goalItems.length > 1 ? 's' : ''} concluída${goalItems.filter((g) => g.status === 'done').length > 1 ? 's' : ''}`
              : 'Defina metas para acompanhar sua evolução'}
          </p>
        </div>
      </div>

      <GoalsClient
        goalItems={goalItems}
        procedureOptions={PROCEDURE_TYPES.filter((p) => p.value !== 'nenhum').map((p) => ({
          value: p.value,
          label: p.label,
        }))}
        procCounts={procCounts}
      />
    </div>
  )
}
