'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { EvolutionEntry } from '@/lib/nerve-blocks'
import EmptyChart from '@/components/analytics/EmptyChart'

// Fixed palette for up to 16 block types
const BLOCK_COLORS = [
  '#a78bfa', '#22d3ee', '#34d399', '#fb923c',
  '#f472b6', '#facc15', '#818cf8', '#6ee7b7',
  '#67e8f9', '#fca5a5', '#86efac', '#fde68a',
  '#c4b5fd', '#5eead4', '#fdba74', '#a5f3fc',
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const active_ = payload.filter((p: any) => p.value > 0).sort((a: any, b: any) => b.value - a.value)
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm min-w-[160px]">
      <p className="mb-2 font-medium text-slate-400">{label}</p>
      {active_.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-xs">
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span className="font-bold text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function BlockEvolutionChart({
  data, keys,
}: {
  data: EvolutionEntry[]
  keys: string[]
}) {
  if (data.length === 0) return <EmptyChart height={220} />

  const topKeys = keys
    .map((k) => ({ k, total: data.reduce((s, d) => s + (Number(d[k]) || 0), 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((x) => x.k)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {topKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={BLOCK_COLORS[i % BLOCK_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
