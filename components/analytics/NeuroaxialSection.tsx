'use client'

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import type { NeuroaxialData } from '@/lib/neuroaxial-analytics'
import EmptyChart from './EmptyChart'

// ── Cores ──────────────────────────────────────────────────────────────────

const C_RAQUI       = '#22d3ee'
const C_PERIDURAL   = '#a78bfa'
const C_SENTADO     = '#22d3ee'
const C_DECUBITO    = '#f59e0b'
const C_MEDIANA     = '#34d399'
const C_PARAMEDIANA = '#f472b6'

// ── Tooltips ───────────────────────────────────────────────────────────────

function AttemptsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-slate-200">
            {p.value != null ? `${p.value} tent.` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function RateTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-slate-200">
            {p.value != null ? `${p.value}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function DistTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-slate-300 mb-1.5">{label} tentativa{label !== '1' ? 's' : ''}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-bold text-slate-200">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function PosAttemptsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-bold text-slate-200">
            {p.value != null ? `${p.value} tent.` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-xl text-xs">
      <span style={{ color: p.payload.fill }}>{p.name}</span>
      <span className="ml-2 font-bold text-slate-200">{p.value} ({p.payload.pct}%)</span>
    </div>
  )
}

function legendFmt(v: string) {
  return <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>
}

// ── Subcomponents ─────────────────────────────────────────────────────────

function StatBox({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600">{sub}</p>}
    </div>
  )
}

/** Mini donut for position distribution */
function PositionDonut({ title, sentado, decubito }: {
  title: string
  sentado: number
  decubito: number
}) {
  const total = sentado + decubito
  if (total === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-300">{title}</p>
        <EmptyChart height={140} />
      </div>
    )
  }
  const pieData = [
    { name: 'Sentado',          value: sentado,  pct: Math.round(sentado / total * 100),  fill: C_SENTADO  },
    { name: 'Decúbito Lateral', value: decubito, pct: Math.round(decubito / total * 100), fill: C_DECUBITO },
  ]
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-300">{title}</p>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={62}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-col gap-1">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
              <span className="text-slate-400">{d.name}</span>
            </div>
            <span className="font-semibold text-slate-300">{d.value} <span className="text-slate-600">({d.pct}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Mini donut for puncture approach distribution */
function PunctureDonut({ title, mediana, paramediana }: {
  title: string
  mediana: number
  paramediana: number
}) {
  const total = mediana + paramediana
  if (total === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-300">{title}</p>
        <EmptyChart height={140} />
      </div>
    )
  }
  const pieData = [
    { name: 'Mediana',     value: mediana,     pct: Math.round(mediana / total * 100),     fill: C_MEDIANA },
    { name: 'Paramediana', value: paramediana, pct: Math.round(paramediana / total * 100), fill: C_PARAMEDIANA },
  ]
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-300">{title}</p>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={62}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
              <span className="text-slate-400">{d.name}</span>
            </div>
            <span className="font-semibold text-slate-300">{d.value} <span className="text-slate-600">({d.pct}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function NeuroaxialSection({ data }: { data: NeuroaxialData }) {
  const hasData = data.raqui_total > 0 || data.peridural_total > 0
  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/40 py-12 text-center">
        <p className="text-sm text-slate-500">Nenhum registro de raquianestesia ou peridural no período</p>
      </div>
    )
  }

  // Radar data: normalize all metrics to 0-100 for comparison
  const maxVol = Math.max(data.raqui_total, data.peridural_total, 1)
  const radarData = [
    {
      metric: 'Volume',
      Raqui:    Math.round(data.raqui_total / maxVol * 100),
      Peridural: Math.round(data.peridural_total / maxVol * 100),
    },
    {
      metric: 'Eficiência\n(tent.)',
      Raqui:    data.raqui_avg_attempts    ? Math.round(100 / data.raqui_avg_attempts)    : 0,
      Peridural: data.peridural_avg_attempts ? Math.round(100 / data.peridural_avg_attempts) : 0,
    },
    {
      metric: '1ª Tent.',
      Raqui:    data.raqui_first_rate    ?? 0,
      Peridural: data.peridural_first_rate ?? 0,
    },
  ]

  // Whether we have position data at all
  const hasPosData = (
    data.raqui_position.sentado + data.raqui_position.decubito +
    data.peridural_position.sentado + data.peridural_position.decubito
  ) > 0

  // Whether we have puncture approach data at all
  const hasPunctureData = (
    data.raqui_puncture.mediana + data.raqui_puncture.paramediana +
    data.peridural_puncture.mediana + data.peridural_puncture.paramediana
  ) > 0

  // Position vs attempts — only show rows with data
  const posVsData = data.position_vs_attempts.filter(
    (d) => d.raqui_avg != null || d.peridural_avg != null
  )

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox
          label="Total Raquis"
          value={data.raqui_total}
          sub={data.raqui_avg_attempts != null ? `${data.raqui_avg_attempts} tent./proc.` : undefined}
          accent="text-cyan-400"
        />
        <StatBox
          label="1ª tent. Raqui"
          value={data.raqui_first_rate != null ? `${data.raqui_first_rate}%` : '—'}
          sub="sucesso na 1ª tentativa"
          accent="text-emerald-400"
        />
        <StatBox
          label="Total Peridurais"
          value={data.peridural_total}
          sub={data.peridural_avg_attempts != null ? `${data.peridural_avg_attempts} tent./proc.` : undefined}
          accent="text-violet-400"
        />
        <StatBox
          label="1ª tent. Peridural"
          value={data.peridural_first_rate != null ? `${data.peridural_first_rate}%` : '—'}
          sub="sucesso na 1ª tentativa"
          accent="text-emerald-400"
        />
      </div>

      {/* ── Position distribution + Radar comparison ──────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Position donuts */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Posição do Paciente</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição Sentado vs Decúbito Lateral</p>
          </div>
          {hasPosData ? (
            <div className="grid grid-cols-2 gap-4">
              <PositionDonut
                title="Raquianestesia"
                sentado={data.raqui_position.sentado}
                decubito={data.raqui_position.decubito}
              />
              <PositionDonut
                title="Peridural"
                sentado={data.peridural_position.sentado}
                decubito={data.peridural_position.decubito}
              />
            </div>
          ) : (
            <EmptyChart height={160} />
          )}
        </div>

        {/* Radar comparison */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-200">Comparativo Geral</h3>
            <p className="text-xs text-slate-500 mt-0.5">Raqui vs Peridural — valores normalizados</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Raquianestesia" dataKey="Raqui"     stroke={C_RAQUI}    fill={C_RAQUI}    fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Peridural"      dataKey="Peridural" stroke={C_PERIDURAL} fill={C_PERIDURAL} fillOpacity={0.15} strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
              <Tooltip formatter={(v: any) => [`${v}`, '']} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Puncture approach distribution ────────────────────── */}
      {hasPunctureData && (
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Via de Punção</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição Mediana vs Paramediana</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PunctureDonut
              title="Raquianestesia"
              mediana={data.raqui_puncture.mediana}
              paramediana={data.raqui_puncture.paramediana}
            />
            <PunctureDonut
              title="Peridural"
              mediana={data.peridural_puncture.mediana}
              paramediana={data.peridural_puncture.paramediana}
            />
          </div>
        </div>
      )}

      {/* ── Charts grid: learning curve + distribution ─────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Curva de aprendizado */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Curva de Aprendizado</h3>
            <p className="text-xs text-slate-500 mt-0.5">Média de tentativas por mês</p>
          </div>
          {data.monthly.length < 2 ? <EmptyChart height={180} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.monthly} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[1, 'auto']} allowDecimals />
                <Tooltip content={<AttemptsTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                <ReferenceLine y={1} stroke="#374151" strokeDasharray="4 2" />
                <Line dataKey="raqui_avg"    name="Raquianestesia" stroke={C_RAQUI}    strokeWidth={2} dot={{ r: 3, fill: C_RAQUI }}    connectNulls />
                <Line dataKey="peridural_avg" name="Peridural"      stroke={C_PERIDURAL} strokeWidth={2} dot={{ r: 3, fill: C_PERIDURAL }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribuição de tentativas */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Distribuição de Tentativas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quantas vezes realizou em 1, 2 ou 3+ tentativas</p>
          </div>
          {data.distribution.every((d) => d.raqui + d.peridural === 0) ? <EmptyChart height={180} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.distribution} barSize={20} barGap={4} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${v === '3+' ? '' : 'x'}`} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DistTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                <Bar dataKey="raqui"    name="Raquianestesia" fill={C_RAQUI}    radius={[4, 4, 0, 0]} />
                <Bar dataKey="peridural" name="Peridural"      fill={C_PERIDURAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Posição vs tentativas */}
        {posVsData.length > 0 && (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Posição vs Tentativas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Média de tentativas por posição do paciente</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={posVsData} barSize={22} barGap={4} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="position" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[1, 'auto']} allowDecimals />
                <Tooltip content={<PosAttemptsTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                <ReferenceLine y={1} stroke="#374151" strokeDasharray="4 2" />
                <Bar dataKey="raqui_avg"    name="Raquianestesia" fill={C_RAQUI}    radius={[4, 4, 0, 0]} />
                <Bar dataKey="peridural_avg" name="Peridural"      fill={C_PERIDURAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Taxa de 1ª tentativa ao longo do tempo */}
        {data.monthly.length >= 2 && (
          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Taxa de Sucesso na 1ª Tentativa</h3>
              <p className="text-xs text-slate-500 mt-0.5">Percentual realizado na primeira tentativa por mês</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.monthly} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip content={<RateTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 2" label={{ value: '80%', fill: '#10b981', fontSize: 10 }} />
                <Line dataKey="raqui_first_rate"    name="Raquianestesia" stroke={C_RAQUI}    strokeWidth={2} dot={{ r: 3, fill: C_RAQUI }}    connectNulls />
                <Line dataKey="peridural_first_rate" name="Peridural"      stroke={C_PERIDURAL} strokeWidth={2} dot={{ r: 3, fill: C_PERIDURAL }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
