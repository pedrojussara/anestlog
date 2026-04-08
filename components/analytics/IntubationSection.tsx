'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { IntubationStats } from '@/lib/analytics'
import { Wind, CheckCircle2, XCircle, Activity, Zap, GitBranch } from 'lucide-react'

interface Props { data: IntubationStats }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm">
      <p style={{ color: payload[0].payload.color }} className="font-bold">
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  )
}

export default function IntubationSection({ data }: Props) {
  if (data.total === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-slate-600">
        Nenhuma intubação registrada no período
      </div>
    )
  }

  const difficultyData = [
    { name: 'Via aérea difícil', value: data.difficult, color: '#fb923c' },
    { name: 'Via aérea normal',  value: data.normal,    color: '#164e63' },
  ]

  const statusData = [
    { name: 'Sucesso', value: data.successCount, color: '#10b981' },
    { name: 'Falha',   value: data.failureCount, color: '#ef4444' },
  ]

  const difficultyRate  = data.total > 0 ? Math.round((data.difficult    / data.total) * 100) : 0
  const armoredRate     = data.total > 0 ? Math.round((data.armoredTube  / data.total) * 100) : 0
  const guideWireRate   = data.total > 0 ? Math.round((data.guideWire    / data.total) * 100) : 0

  const armoredData = [
    { name: 'Com Tubo Aramado', value: data.armoredTube,            color: '#22d3ee' },
    { name: 'Sem Tubo Aramado', value: data.total - data.armoredTube, color: '#1e3a4a' },
  ]
  const guideWireData = [
    { name: 'Com Bougie',  value: data.guideWire,            color: '#a78bfa' },
    { name: 'Sem Bougie',  value: data.total - data.guideWire, color: '#2d1f4a' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards — linha 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat
          label="Total de intubações"
          value={data.total}
          icon={<Activity size={15} />}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />
        <MiniStat
          label="Via aérea difícil"
          value={data.difficult}
          icon={<Wind size={15} />}
          color="text-orange-400"
          bg="bg-orange-500/10"
        />
        <MiniStat
          label="Taxa de sucesso"
          value={`${data.successRate}%`}
          icon={<CheckCircle2 size={15} />}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <MiniStat
          label="Falhas"
          value={data.failureCount}
          icon={<XCircle size={15} />}
          color="text-red-400"
          bg="bg-red-500/10"
        />
      </div>

      {/* Stat cards — linha 2: dispositivos auxiliares */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat
          label={`Tubo Aramado (${armoredRate}% das intubações)`}
          value={data.armoredTube}
          icon={<Zap size={15} />}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />
        <MiniStat
          label={`Fio Guia / Bougie (${guideWireRate}% das intubações)`}
          value={data.guideWire}
          icon={<GitBranch size={15} />}
          color="text-violet-400"
          bg="bg-violet-500/10"
        />
      </div>

      {/* Donuts: dificuldade + sucesso */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DonutPanel
          title="Via Aérea Difícil vs Normal"
          data={difficultyData}
          centerLabel={`${difficultyRate}%`}
          centerSub="difícil"
        />
        <DonutPanel
          title="Sucesso vs Falha"
          data={statusData}
          centerLabel={`${data.successRate}%`}
          centerSub="sucesso"
        />
      </div>

      {/* Donuts: dispositivos auxiliares (só se há ao menos um registro) */}
      {(data.armoredTube > 0 || data.guideWire > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DonutPanel
            title="Uso de Tubo Aramado"
            data={armoredData}
            centerLabel={`${armoredRate}%`}
            centerSub="aramado"
          />
          <DonutPanel
            title="Uso de Fio Guia / Bougie"
            data={guideWireData}
            centerLabel={`${guideWireRate}%`}
            centerSub="bougie"
          />
        </div>
      )}
    </div>
  )
}

function MiniStat({
  label, value, icon, color, bg,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  bg: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-700 bg-gray-900/60 p-3">
      <div className={`w-fit rounded-lg p-1.5 ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 leading-tight">{label}</p>
    </div>
  )
}

function DonutPanel({
  title,
  data,
  centerLabel,
  centerSub,
}: {
  title: string
  data: { name: string; value: number; color: string }[]
  centerLabel: string
  centerSub: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-700 bg-gray-900/40 p-4">
      <p className="text-xs font-semibold text-slate-400">{title}</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-100">{centerLabel}</span>
          <span className="text-xs text-slate-500">{centerSub}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-400">{d.name}</span>
            </div>
            <span className="font-semibold text-slate-300">
              {d.value}
              <span className="ml-1 text-slate-600 font-normal">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
