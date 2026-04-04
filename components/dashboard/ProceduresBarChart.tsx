'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { ProcedureStatsEntry } from '@/lib/analytics'
import EmptyChart from '@/components/analytics/EmptyChart'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ProcedureStatsEntry
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm">
      <p className="font-semibold text-slate-200 mb-1.5">{d.label}</p>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total</span>
          <span className="font-bold text-slate-200">{d.total}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400">Sucesso</span>
          <span className="font-bold text-emerald-300">{d.success}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-400">Falha</span>
          <span className="font-bold text-red-300">{d.failure}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-gray-700 pt-1 mt-0.5">
          <span className="text-slate-500">Taxa</span>
          <span className="font-bold text-cyan-400">{d.rate}%</span>
        </div>
      </div>
    </div>
  )
}

export default function ProceduresBarChart({ data }: { data: ProcedureStatsEntry[] }) {
  if (data.length === 0) return <EmptyChart height={180} />

  const max = data[0]?.total ?? 1
  const chartHeight = Math.max(180, data.length * 40)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        barSize={18}
        margin={{ top: 0, right: 50, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={148}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="total" radius={[0, 6, 6, 0]}>
          <LabelList
            dataKey="total"
            position="right"
            style={{ fill: '#64748b', fontSize: 11 }}
          />
          {data.map((d) => (
            <Cell
              key={d.type}
              fill={d.total === max ? '#22d3ee' : '#164e63'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
