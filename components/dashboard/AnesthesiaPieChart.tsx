'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { AnesthesiaType } from '@/types'
import { ANESTHESIA_LABELS, ANESTHESIA_COLORS } from '@/lib/anesthesia'

interface Props {
  data: { type: AnesthesiaType; count: number }[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm">
      <p className="text-slate-300 font-medium">{name}</p>
      <p className="text-cyan-400 font-bold mt-0.5">{value} procedimento{value !== 1 ? 's' : ''}</p>
    </div>
  )
}

function CustomLegend({ payload }: any) {
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {payload?.map((entry: any) => (
        <li key={entry.value} className="flex items-center gap-2 text-xs text-slate-400">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="truncate">{entry.value}</span>
          <span className="ml-auto font-semibold text-slate-300">{entry.payload.count}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AnesthesiaPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-600">
        Nenhum dado disponível
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: ANESTHESIA_LABELS[d.type] ?? d.type,
    count: d.count,
    color: ANESTHESIA_COLORS[d.type] ?? '#64748b',
  }))

  return (
    <div className="flex flex-col">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend payload={chartData.map((d) => ({ value: d.name, color: d.color, payload: d }))} />
    </div>
  )
}
