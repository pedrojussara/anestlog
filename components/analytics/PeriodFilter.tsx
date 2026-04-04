'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { CalendarRange } from 'lucide-react'

const PRESETS = [
  { value: 'week',  label: '7 dias' },
  { value: 'month', label: '30 dias' },
  { value: 'year',  label: '12 meses' },
  { value: 'custom', label: 'Personalizado' },
] as const

type Preset = typeof PRESETS[number]['value']

export default function PeriodFilter() {
  const router   = useRouter()
  const params   = useSearchParams()
  const pathname = usePathname()

  const period = (params.get('period') ?? 'year') as Preset
  const customFrom = params.get('from') ?? ''
  const customTo   = params.get('to')   ?? ''

  const [localFrom, setLocalFrom] = useState(customFrom)
  const [localTo,   setLocalTo]   = useState(customTo)

  const update = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    router.push(`${pathname}?${next.toString()}`)
  }, [router, params])

  function applyCustom() {
    if (localFrom && localTo) {
      update({ period: 'custom', from: localFrom, to: localTo })
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarRange size={13} />
        <span>Período</span>
      </div>

      {/* Preset pills */}
      <div className="flex rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => update({ period: p.value, from: '', to: '' })}
            className={[
              'px-3.5 py-2 text-xs font-medium transition-colors',
              period === p.value
                ? 'bg-cyan-500 text-gray-900'
                : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localFrom}
            max={localTo || today}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs
                       text-slate-300 outline-none focus:border-cyan-500 [color-scheme:dark]"
          />
          <span className="text-xs text-slate-600">até</span>
          <input
            type="date"
            value={localTo}
            min={localFrom}
            max={today}
            onChange={(e) => setLocalTo(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs
                       text-slate-300 outline-none focus:border-cyan-500 [color-scheme:dark]"
          />
          <button
            onClick={applyCustom}
            disabled={!localFrom || !localTo}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-gray-900
                       hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
