'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Entry { label: string; count: number; pct: number }

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#475569']

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as Entry & { color: string }
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm">
      <p className="font-semibold" style={{ color: d.color }}>{d.label}</p>
      <p className="text-xs text-slate-400 mt-1">{d.count} bloqueio{d.count !== 1 ? 's' : ''} · {d.pct}%</p>
    </div>
  )
}

export default function PainDistribution({ data }: { data: Entry[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null

  const chartData = data.filter((d) => d.count > 0).map((d, i) => ({ ...d, color: COLORS[i] }))

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-slate-400 truncate flex-1">{d.label}</span>
            <span className="font-semibold text-slate-300">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
