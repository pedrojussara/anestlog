'use client'

import { useState } from 'react'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, ReferenceLine, Label,
} from 'recharts'
import type { FailureTrendEntry } from '@/lib/failures'
import EmptyChart from '@/components/analytics/EmptyChart'

type ViewMode = 'count' | 'rate'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as FailureTrendEntry
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm min-w-[160px]">
      <p className="mb-2 font-medium text-slate-400">{label}</p>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total proc.</span>
          <span className="font-bold text-slate-300">{d.total}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-400">Falhas</span>
          <span className="font-bold text-red-300">{d.failures}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-gray-700 pt-1 mt-0.5">
          <span className="text-slate-500">Taxa</span>
          <span className={`font-bold ${d.rate >= 30 ? 'text-red-400' : d.rate >= 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {d.rate}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function FailureTrendChart({ data }: { data: FailureTrendEntry[] }) {
  const [view, setView] = useState<ViewMode>('count')

  if (data.length === 0) return <EmptyChart height={240} />

  const avgRate = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length)
    : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Taxa média: </span>
          <span className={`font-bold ${avgRate >= 30 ? 'text-red-400' : avgRate >= 15 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {avgRate}%
          </span>
        </div>
        <div className="flex rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
          {(['count', 'rate'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                'px-3 py-1.5 text-xs font-medium transition-colors',
                view === v ? 'bg-red-500/80 text-white' : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {v === 'count' ? 'Contagem' : 'Taxa (%)'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        {view === 'count' ? (
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => (
                <span style={{ color: '#94a3b8', fontSize: 11 }}>
                  {v === 'total' ? 'Total proc.' : 'Falhas'}
                </span>
              )}
            />
            <Bar dataKey="total"    fill="#1e3a5f" radius={[4,4,0,0]} barSize={20} />
            <Bar dataKey="failures" fill="#ef4444" radius={[4,4,0,0]} barSize={20} />
          </ComposedChart>
        ) : (
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 15, 30, 50, 75, 100]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Reference lines for thresholds */}
            <ReferenceLine y={15} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.5}>
              <Label value="15%" position="right" fill="#f59e0b" fontSize={10} />
            </ReferenceLine>
            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.5}>
              <Label value="30%" position="right" fill="#ef4444" fontSize={10} />
            </ReferenceLine>
            <defs>
              <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="rate"
              fill="url(#rateGrad)"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
