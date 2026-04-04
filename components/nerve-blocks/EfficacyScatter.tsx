'use client'

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ZAxis, Label,
} from 'recharts'
import type { BlockStat } from '@/lib/nerve-blocks'
import EmptyChart from '@/components/analytics/EmptyChart'

interface ScatterPoint {
  x: number       // success rate 0-100
  y: number       // inverted pain: (10 - avgPain) * 10 → 0-100
  z: number       // total (bubble size)
  name: string
  successRate: number
  avgPain: number
  total: number
  efficacyScore: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ScatterPoint
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-sm min-w-[180px]">
      <p className="font-semibold text-violet-300 mb-2">{d.name}</p>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Taxa de sucesso</span>
          <span className="font-bold text-emerald-400">{d.successRate}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Dor média</span>
          <span className="font-bold text-amber-400">
            {d.avgPain > 0 ? `${d.avgPain}/10` : 'N/D'}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Eficácia</span>
          <span className="font-bold text-violet-400">{d.efficacyScore}/100</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total</span>
          <span className="font-bold text-slate-300">{d.total}</span>
        </div>
      </div>
    </div>
  )
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props
  if (!cx || !cy) return null
  const r = Math.max(6, Math.min(22, 6 + payload.z * 1.5))
  const score = payload.efficacyScore
  const fill = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill={fill} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.85} stroke="none" />
      <text
        x={cx}
        y={cy - r - 5}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={9}
        className="pointer-events-none"
      >
        {payload.name.length > 14 ? payload.name.slice(0, 13) + '…' : payload.name}
      </text>
    </g>
  )
}

export default function EfficacyScatter({ data }: { data: BlockStat[] }) {
  const withData = data.filter((d) => d.total >= 1)
  if (withData.length === 0) return <EmptyChart height={300} />

  const points: ScatterPoint[] = withData.map((d) => ({
    x: d.successRate,
    y: d.painSamples > 0 ? Math.round((10 - d.avgPain) * 10) : 50,
    z: d.total,
    name: d.block_type,
    successRate: d.successRate,
    avgPain: d.avgPain,
    total: d.total,
    efficacyScore: d.efficacyScore,
  }))

  return (
    <div className="flex flex-col gap-3">
      {/* Quadrant legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-slate-400"><span className="font-semibold text-emerald-400">Ideal</span> — alto sucesso + baixa dor</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-slate-400"><span className="font-semibold text-red-400">Crítico</span> — baixo sucesso + alta dor</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
          <span className="text-slate-400"><span className="font-semibold text-yellow-400">Atenção</span> — sucesso mas dor elevada</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/40 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-slate-500 flex-shrink-0" />
          <span className="text-slate-400">Tamanho = volume de bloqueios</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          {/* Quadrant reference lines */}
          <ReferenceLine x={70} stroke="#374151" strokeDasharray="6 3" />
          <ReferenceLine y={50} stroke="#374151" strokeDasharray="6 3" />

          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          >
            <Label value="Taxa de sucesso (%)" offset={-15} position="insideBottom" fill="#475569" fontSize={11} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          >
            <Label value="Dor baixa →" angle={-90} position="insideLeft" fill="#475569" fontSize={11} offset={15} />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#374151' }} />
          <Scatter data={points} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
