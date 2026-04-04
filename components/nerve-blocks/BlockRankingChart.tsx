'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { BlockStat } from '@/lib/nerve-blocks'
import EmptyChart from '@/components/analytics/EmptyChart'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as BlockStat
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm min-w-[180px]">
      <p className="font-semibold text-slate-200 mb-2">{d.block_type}</p>
      <div className="flex flex-col gap-1 text-xs">
        <Row label="Total" value={d.total} color="text-violet-400" />
        <Row label="Sucesso" value={d.success} color="text-emerald-400" />
        <Row label="Falha" value={d.failure} color="text-red-400" />
        <Row label="Taxa" value={`${d.successRate}%`} color="text-cyan-400" />
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  )
}

export default function BlockRankingChart({ data }: { data: BlockStat[] }) {
  if (data.length === 0) return <EmptyChart />

  const max = data[0]?.total ?? 1
  const chartHeight = Math.max(260, data.length * 44)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        barSize={22}
        margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
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
          dataKey="block_type"
          width={145}
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
              key={d.block_type}
              fill={d.total === max ? '#a78bfa' : '#2e1065'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
