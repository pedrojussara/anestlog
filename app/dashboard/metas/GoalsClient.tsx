'use client'

import { useState, useTransition } from 'react'
import {
  Target, Plus, Trash2, CheckCircle2, AlertTriangle, Clock,
  ChevronDown, BarChart2, Calendar, TrendingUp, TrendingDown, AlertCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts'
import { saveGoal, deleteGoal } from '@/app/actions/goals'
import { NERVE_BLOCK_TYPES, NERVE_BLOCK_GROUPS } from '@/lib/constants'

const NERVE_BLOCK_PROCEDURE = 'bloqueio_periferico'

interface GoalItem {
  procedure_type: string
  block_type: string | null
  label: string
  target: number
  done: number
  pct: number
  remaining: number
  status: 'done' | 'near' | 'far'
  deadline: string | null
  daysLeft: number | null
  neededPerWeek: number | null
  deadlineStatus: 'expired' | 'on_track' | 'behind' | null
}

interface Props {
  goalItems: GoalItem[]
  procedureOptions: { value: string; label: string }[]
  procCounts: { type: string; count: number }[]
}

const STATUS_CONFIG = {
  done: {
    border: 'border-emerald-500/30',
    bg:     'bg-emerald-500/5',
    bar:    'bg-emerald-500',
    badge:  'bg-emerald-500/15 text-emerald-400',
    icon:   <CheckCircle2 size={14} className="text-emerald-400" />,
    label:  'Concluída',
  },
  near: {
    border: 'border-yellow-500/30',
    bg:     'bg-yellow-500/5',
    bar:    'bg-yellow-500',
    badge:  'bg-yellow-500/15 text-yellow-400',
    icon:   <AlertTriangle size={14} className="text-yellow-400" />,
    label:  'Quase lá',
  },
  far: {
    border: 'border-gray-700',
    bg:     'bg-gray-800',
    bar:    'bg-cyan-500',
    badge:  'bg-gray-700 text-slate-400',
    icon:   <Clock size={14} className="text-slate-500" />,
    label:  'Em progresso',
  },
} as const

const DEADLINE_CONFIG = {
  expired: {
    text:   'text-red-400',
    bg:     'bg-red-500/10',
    border: 'border-red-500/30',
    icon:   <AlertCircle size={12} className="text-red-400" />,
  },
  on_track: {
    text:   'text-emerald-400',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon:   <TrendingUp size={12} className="text-emerald-400" />,
  },
  behind: {
    text:   'text-yellow-400',
    bg:     'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon:   <TrendingDown size={12} className="text-yellow-400" />,
  },
} as const

function formatDeadline(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm">
      <p className="font-medium text-slate-300 mb-1.5 text-xs">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4 text-xs">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-bold text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function DeadlineInfo({ g }: { g: GoalItem }) {
  if (!g.deadline) return null
  const cfg = g.deadlineStatus ? DEADLINE_CONFIG[g.deadlineStatus] : null

  return (
    <div className={`flex flex-col gap-1.5 rounded-lg border p-2.5 ${cfg?.bg ?? 'bg-gray-700/40'} ${cfg?.border ?? 'border-gray-600'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar size={11} className="text-slate-500 flex-shrink-0" />
          <span>{formatDeadline(g.deadline)}</span>
        </div>
        {g.deadlineStatus === 'expired' ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
            <AlertCircle size={11} />
            Prazo expirado
          </span>
        ) : g.daysLeft !== null ? (
          <span className={`text-xs font-semibold ${cfg?.text ?? 'text-slate-400'}`}>
            {g.daysLeft === 0 ? 'Vence hoje' : `${g.daysLeft}d restantes`}
          </span>
        ) : null}
      </div>

      {g.deadlineStatus !== 'expired' && g.neededPerWeek !== null && g.remaining > 0 && (
        <div className={`flex items-center gap-1.5 text-xs ${cfg?.text ?? 'text-slate-400'}`}>
          {cfg?.icon}
          <span>
            {g.deadlineStatus === 'on_track' ? 'No ritmo — ' : 'Atrasado — '}
            {g.neededPerWeek} procedimento{g.neededPerWeek !== 1 ? 's' : ''}/semana para bater no prazo
          </span>
        </div>
      )}
    </div>
  )
}

function SelectField({ label, value, onChange, children, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-900
                     px-4 py-2.5 pr-10 text-sm text-slate-100 outline-none
                     focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                     cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {children}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  )
}

export default function GoalsClient({ goalItems, procedureOptions }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [selectedBlockType, setSelectedBlockType] = useState('')
  const [targetCount, setTargetCount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  // Sets for filtering available options
  const nonBlockGoalTypes = new Set(
    goalItems.filter((g) => !g.block_type).map((g) => g.procedure_type)
  )
  const usedBlockTypes = new Set(
    goalItems.filter((g) => g.block_type).map((g) => g.block_type as string)
  )
  const allBlockTypesUsed = (NERVE_BLOCK_TYPES as readonly string[]).every((bt) => usedBlockTypes.has(bt))

  const availableOptions = procedureOptions.filter((p) => {
    if (p.value === NERVE_BLOCK_PROCEDURE) return !allBlockTypesUsed
    return !nonBlockGoalTypes.has(p.value)
  })

  const availableBlockTypes = (NERVE_BLOCK_TYPES as readonly string[]).filter(
    (bt) => !usedBlockTypes.has(bt)
  )

  const isNerveBlock = selectedType === NERVE_BLOCK_PROCEDURE

  function resetForm() {
    setSelectedType('')
    setSelectedBlockType('')
    setTargetCount('')
    setDeadline('')
    setFormError(null)
    setShowForm(false)
  }

  function handleSave() {
    setFormError(null)
    if (!selectedType) { setFormError('Selecione o tipo de procedimento.'); return }
    if (isNerveBlock && !selectedBlockType) { setFormError('Selecione o tipo de bloqueio.'); return }
    const n = Number(targetCount)
    if (!n || n < 1) { setFormError('A meta deve ser um número maior que zero.'); return }

    startTransition(async () => {
      const result = await saveGoal({
        procedure_type: selectedType,
        target_count:   n,
        deadline:       deadline || null,
        block_type:     isNerveBlock ? selectedBlockType : null,
      })
      if (result?.error) { setFormError(result.error); return }
      resetForm()
    })
  }

  function handleDelete(procedureType: string, blockType: string | null) {
    const key = `${procedureType}:${blockType ?? ''}`
    setDeletingKey(key)
    startTransition(async () => {
      await deleteGoal(procedureType, blockType)
      setDeletingKey(null)
    })
  }

  // Chart data — truncate long labels
  const chartData = goalItems.map((g) => ({
    name:      g.label.length > 22 ? g.label.slice(0, 21) + '…' : g.label,
    Meta:      g.target,
    Realizado: g.done,
    pct:       g.pct,
  }))

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Summary pills */}
      {goalItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['done', 'near', 'far'] as const).map((s) => {
            const count = goalItems.filter((g) => g.status === s).length
            if (count === 0) return null
            const cfg = STATUS_CONFIG[s]
            return (
              <div key={s} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${cfg.badge} border-transparent`}>
                {cfg.icon}
                {count} {cfg.label.toLowerCase()}{count > 1 ? 's' : ''}
              </div>
            )
          })}
          {goalItems.filter((g) => g.deadlineStatus === 'expired').length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
              <AlertCircle size={12} />
              {goalItems.filter((g) => g.deadlineStatus === 'expired').length} prazo expirado
            </div>
          )}
        </div>
      )}

      {/* Gráfico meta vs realizado */}
      {goalItems.length > 0 && (
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Meta vs Realizado</h2>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(200, goalItems.length * 44)}>
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={14}
              barGap={2}
              margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
              />
              <Bar dataKey="Meta"      fill="#374151" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Realizado" radius={[0, 4, 4, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.pct >= 100 ? '#10b981' : d.pct >= 70 ? '#f59e0b' : '#22d3ee'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cards de metas */}
      {goalItems.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {goalItems.map((g) => {
            const cfg    = STATUS_CONFIG[g.status]
            const delKey = `${g.procedure_type}:${g.block_type ?? ''}`
            return (
              <div key={delKey} className={`flex flex-col gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 leading-tight">{g.label}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit ${cfg.badge}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                      {g.deadline && g.deadlineStatus && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium
                          ${g.deadlineStatus === 'expired' ? 'text-red-400'
                            : g.deadlineStatus === 'on_track' ? 'text-emerald-400'
                            : 'text-yellow-400'}`}>
                          <Calendar size={11} />
                          {g.deadlineStatus === 'expired' ? 'Expirado'
                            : g.deadlineStatus === 'on_track' ? 'No ritmo'
                            : 'Atrasado'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(g.procedure_type, g.block_type)}
                    disabled={deletingKey === delKey}
                    className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{g.done} de {g.target}</span>
                    <span className={`font-bold ${g.status === 'done' ? 'text-emerald-400' : g.status === 'near' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      {g.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all ${cfg.bar}`}
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                  {g.status !== 'done' && (
                    <p className="text-xs text-slate-600">Faltam {g.remaining} procedimento{g.remaining > 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Deadline info */}
                <DeadlineInfo g={g} />
              </div>
            )
          })}
        </div>
      )}

      {/* Formulário de nova meta */}
      {showForm ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Target size={14} className="text-amber-400" />
            Nova Meta
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Procedure type */}
            <SelectField
              label="Tipo de procedimento"
              value={selectedType}
              onChange={(v) => { setSelectedType(v); setSelectedBlockType('') }}
            >
              <option value="">Selecione...</option>
              {availableOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
              ))}
            </SelectField>

            {/* Block type (conditional) */}
            {isNerveBlock ? (
              <SelectField
                label="Tipo de bloqueio"
                value={selectedBlockType}
                onChange={setSelectedBlockType}
              >
                <option value="">Selecione o bloqueio...</option>
                {NERVE_BLOCK_GROUPS.map((group) => {
                  const available = group.items.filter((bt) => availableBlockTypes.includes(bt))
                  if (available.length === 0) return null
                  return (
                    <optgroup key={group.region} label={group.region} className="bg-gray-900 text-slate-400">
                      {available.map((bt) => (
                        <option key={bt} value={bt} className="bg-gray-900 text-slate-100">{bt}</option>
                      ))}
                    </optgroup>
                  )
                })}
              </SelectField>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Meta (quantidade)</label>
                <input
                  type="number"
                  min={1}
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5
                             text-sm text-slate-100 placeholder:text-slate-600 outline-none
                             focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            {/* Quantity (shown separately when nerve block is selected) */}
            {isNerveBlock && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Meta (quantidade)</label>
                <input
                  type="number"
                  min={1}
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5
                             text-sm text-slate-100 placeholder:text-slate-600 outline-none
                             focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            {/* Deadline */}
            <div className={`flex flex-col gap-1.5 ${isNerveBlock ? '' : 'sm:col-span-1'} ${!isNerveBlock ? 'sm:col-start-1 sm:col-span-2' : ''}`}>
              <label className="text-xs font-medium text-slate-400">
                Prazo <span className="text-slate-600 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  min={minDate}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 pl-9 pr-4 py-2.5
                             text-sm text-slate-100 outline-none [color-scheme:dark]
                             focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-400">{formError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-slate-400
                         hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm
                         font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-50
                         transition-colors"
            >
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
              ) : (
                <Target size={14} />
              )}
              Salvar meta
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          disabled={availableOptions.length === 0}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed
                     border-gray-700 py-5 text-sm text-slate-500 transition-all
                     hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-400
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {availableOptions.length === 0 ? 'Todas as metas criadas' : 'Adicionar nova meta'}
        </button>
      )}

      {/* Empty state */}
      {goalItems.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border
                        border-dashed border-gray-700 bg-gray-800/40 py-16 text-center">
          <div className="rounded-2xl bg-gray-800 p-4">
            <Target size={28} className="text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Nenhuma meta definida ainda</p>
            <p className="text-xs text-slate-600 mt-1">Crie metas para acompanhar sua evolução e motivar-se</p>
          </div>
        </div>
      )}
    </div>
  )
}
