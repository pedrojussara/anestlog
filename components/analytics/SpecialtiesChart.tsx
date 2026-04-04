'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { SpecialtyRankEntry } from '@/lib/analytics'
import EmptyChart from './EmptyChart'

interface Props { data: SpecialtyRankEntry[] }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm">
      <p className="font-medium text-slate-200">{payload[0].payload.specialty}</p>
      <p className="text-cyan-400 font-bold">{payload[0].value} cirurgia{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function SpecialtiesChart({ data }: Props) {
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')

  if (data.length === 0) return <EmptyChart />

  const sorted = [...data].sort((a, b) =>
    order === 'desc' ? b.count - a.count : a.count - b.count
  )
  const max = sorted[0]?.count ?? 1

  const chartHeight = Math.max(260, sorted.length * 44)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
          {(['desc', 'asc'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrder(o)}
              className={[
                'px-3 py-1.5 text-xs font-medium transition-colors',
                order === o ? 'bg-cyan-500 text-gray-900' : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {o === 'desc' ? '↓ Mais realizadas' : '↑ Menos realizadas'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
          barSize={22}
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
            dataKey="specialty"
            width={160}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            <LabelList
              dataKey="count"
              position="right"
              style={{ fill: '#64748b', fontSize: 11 }}
            />
            {sorted.map((entry) => (
              <Cell
                key={entry.specialty}
                fill={entry.count === max ? '#22d3ee' : '#164e63'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
