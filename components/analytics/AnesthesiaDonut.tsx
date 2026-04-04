'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { AnesthesiaDistEntry } from '@/lib/analytics'
import EmptyChart from './EmptyChart'

interface Props {
  data: AnesthesiaDistEntry[]
  total: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as AnesthesiaDistEntry & { pct: number }
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm">
      <p className="font-medium text-slate-200">{d.label}</p>
      <p className="font-bold" style={{ color: d.color }}>{d.count} ({d.pct}%)</p>
    </div>
  )
}

export default function AnesthesiaDonut({ data, total }: Props) {
  if (data.length === 0) return <EmptyChart />

  const chartData = data.map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }))

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.type} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda customizada */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {chartData.map((d) => (
          <div key={d.type} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="truncate text-slate-400 flex-1">{d.label}</span>
            <span className="font-semibold text-slate-300">{d.count}</span>
            <span className="text-slate-600 w-8 text-right">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
