'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { FailureByType } from '@/lib/failures'
import EmptyChart from '@/components/analytics/EmptyChart'

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as FailureByType
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm min-w-[180px]">
      <p className="font-semibold text-slate-200 mb-2">{d.label}</p>
      <div className="flex flex-col gap-1 text-xs">
        <Row label="Falhas"     value={d.failureCount}         color="text-red-400" />
        <Row label="Total"      value={d.totalCount}           color="text-slate-300" />
        <Row label="Taxa"       value={`${d.failureRate}%`}    color={rateColor(d.failureRate)} />
        {d.needsAttention && (
          <p className="mt-1 text-orange-400 font-semibold">⚠ Necessita atenção</p>
        )}
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

function rateColor(rate: number) {
  if (rate >= 30) return 'text-red-400'
  if (rate >= 15) return 'text-yellow-400'
  return 'text-emerald-400'
}

function cellColor(d: FailureByType) {
  if (d.needsAttention)   return '#ef4444'
  if (d.failureRate >= 15) return '#f59e0b'
  return '#374151'
}

export default function FailuresByTypeChart({ data }: { data: FailureByType[] }) {
  const withFailures = data.filter((d) => d.failureCount > 0)
  if (withFailures.length === 0) return <EmptyChart />

  const chartHeight = Math.max(220, withFailures.length * 44)

  return (
    <div className="flex flex-col gap-3">
      {/* Color legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <LegendDot color="bg-red-500"    label="Crítico (≥ 30%)" />
        <LegendDot color="bg-yellow-500" label="Atenção (15–30%)" />
        <LegendDot color="bg-gray-600"   label="Dentro do normal" />
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={withFailures}
          layout="vertical"
          barSize={22}
          margin={{ top: 0, right: 55, bottom: 0, left: 0 }}
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
            width={145}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="failureCount" radius={[0, 6, 6, 0]}>
            <LabelList
              dataKey="failureCount"
              position="right"
              style={{ fill: '#64748b', fontSize: 11 }}
            />
            {withFailures.map((d) => (
              <Cell key={d.type} fill={cellColor(d)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-500">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  )
}
