'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import type { BlockStat } from '@/lib/nerve-blocks'
import EmptyChart from '@/components/analytics/EmptyChart'

function painColor(avg: number): string {
  if (avg <= 3)  return '#10b981'  // emerald — leve
  if (avg <= 6)  return '#f59e0b'  // amber — moderada
  return '#ef4444'                 // red — intensa
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as BlockStat
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm">
      <p className="font-semibold text-slate-200 mb-2">{d.block_type}</p>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Dor média</span>
          <span className="font-bold" style={{ color: painColor(d.avgPain) }}>
            {d.painSamples > 0 ? `${d.avgPain} / 10` : 'N/D'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Amostras</span>
          <span className="font-bold text-slate-300">{d.painSamples}</span>
        </div>
      </div>
    </div>
  )
}

export default function PainLevelChart({ data }: { data: BlockStat[] }) {
  const withPain = data.filter((d) => d.painSamples > 0)
    .sort((a, b) => a.avgPain - b.avgPain)  // best (lowest pain) first

  if (withPain.length === 0) return <EmptyChart />

  const chartHeight = Math.max(260, withPain.length * 44)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={withPain}
        layout="vertical"
        barSize={22}
        margin={{ top: 0, right: 50, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="block_type"
          width={145}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        {/* Reference lines for pain zones */}
        <ReferenceLine x={3} stroke="#10b981" strokeDasharray="4 3" strokeOpacity={0.3} />
        <ReferenceLine x={6} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.3} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="avgPain" radius={[0, 6, 6, 0]}>
          {withPain.map((d) => (
            <Cell key={d.block_type} fill={painColor(d.avgPain)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
