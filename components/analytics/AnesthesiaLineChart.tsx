'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { AnesthesiaEvoEntry } from '@/lib/analytics'
import { ANESTHESIA_LABELS, ANESTHESIA_COLORS } from '@/lib/anesthesia'
import type { AnesthesiaType } from '@/types'
import EmptyChart from './EmptyChart'

interface Props {
  data: AnesthesiaEvoEntry[]
  keys: string[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm min-w-[160px]">
      <p className="mb-2 font-medium text-slate-400">{label}</p>
      {payload
        .filter((p: any) => p.value > 0)
        .sort((a: any, b: any) => b.value - a.value)
        .map((p: any) => (
          <div key={p.dataKey} className="flex justify-between gap-4 text-xs">
            <span style={{ color: p.color }}>
              {ANESTHESIA_LABELS[p.dataKey as AnesthesiaType] ?? p.dataKey}
            </span>
            <span className="font-bold text-slate-200">{p.value}</span>
          </div>
        ))}
    </div>
  )
}

export default function AnesthesiaLineChart({ data, keys }: Props) {
  if (data.length === 0 || keys.length === 0) return <EmptyChart height={220} />

  // Show at most 6 types by total volume to avoid clutter
  const topKeys = keys
    .map((k) => ({
      key: k,
      total: data.reduce((sum, d) => sum + (Number(d[k]) || 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((k) => k.key)

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
        {topKeys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={ANESTHESIA_LABELS[key as AnesthesiaType] ?? key}
            stroke={ANESTHESIA_COLORS[key as AnesthesiaType] ?? '#64748b'}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
