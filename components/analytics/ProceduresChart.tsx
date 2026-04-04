'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts'
import type { ProcedureStatsEntry } from '@/lib/analytics'
import EmptyChart from './EmptyChart'

interface Props { data: ProcedureStatsEntry[] }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const success = payload.find((p: any) => p.dataKey === 'success')?.value ?? 0
  const failure  = payload.find((p: any) => p.dataKey === 'failure')?.value  ?? 0
  const total = success + failure
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-sm min-w-[160px]">
      <p className="mb-2 font-medium text-slate-300">{label}</p>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400">Sucesso</span>
          <span className="font-bold text-slate-200">{success}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-400">Falha</span>
          <span className="font-bold text-slate-200">{failure}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-gray-700 pt-1 mt-1">
          <span className="text-slate-500">Taxa</span>
          <span className="font-bold text-cyan-400">
            {total > 0 ? Math.round((success / total) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ProceduresChart({ data }: Props) {
  const [view, setView] = useState<'volume' | 'rate'>('volume')

  if (data.length === 0) return <EmptyChart />

  const chartHeight = Math.max(280, data.length * 52)

  if (view === 'rate') {
    // Horizontal bars sorted by success rate
    const sorted = [...data].sort((a, b) => b.rate - a.rate)
    return (
      <div className="flex flex-col gap-3">
        <ViewToggle view={view} onChange={setView} />
        <div className="flex flex-col gap-3">
          {sorted.map((d) => (
            <div key={d.type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{d.label}</span>
                <div className="flex items-center gap-3 text-slate-500">
                  <span>{d.total} total</span>
                  <span
                    className={[
                      'font-bold',
                      d.rate >= 80 ? 'text-emerald-400' : d.rate >= 60 ? 'text-yellow-400' : 'text-red-400',
                    ].join(' ')}
                  >
                    {d.rate}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-700">
                {/* Failure */}
                <div className="absolute inset-0 rounded-full bg-red-500/40" />
                {/* Success overlay */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${d.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ViewToggle view={view} onChange={setView} />
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          barSize={10}
          barGap={2}
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
            width={155}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#94a3b8', fontSize: 11 }}>
                {value === 'success' ? 'Sucesso' : 'Falha'}
              </span>
            )}
          />
          <Bar dataKey="success" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="failure" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: 'volume' | 'rate'
  onChange: (v: 'volume' | 'rate') => void
}) {
  return (
    <div className="flex justify-end">
      <div className="flex rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
        {(['volume', 'rate'] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={[
              'px-3 py-1.5 text-xs font-medium transition-colors',
              view === v ? 'bg-cyan-500 text-gray-900' : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {v === 'volume' ? 'Volume' : 'Taxa de sucesso'}
          </button>
        ))}
      </div>
    </div>
  )
}
