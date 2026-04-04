'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { AnesthesiaType } from '@/types'
import { ANESTHESIA_LABELS } from '@/lib/anesthesia'
import type { FilterPeriod } from '@/lib/dashboard'

interface Props {
  specialties: string[]
}

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'week',  label: 'Última semana' },
  { value: 'month', label: 'Último mês' },
  { value: 'year',  label: 'Último ano' },
  { value: 'all',   label: 'Todo período' },
]

const ANESTHESIA_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  ...Object.entries(ANESTHESIA_LABELS).map(([value, label]) => ({ value, label })),
]

export default function DashboardFilters({ specialties }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/dashboard?${next.toString()}`)
    },
    [router, params]
  )

  const period    = (params.get('period') ?? 'year') as FilterPeriod
  const specialty = params.get('specialty') ?? ''
  const anesthesia = params.get('anesthesia') ?? ''

  const specialtyOptions = [
    { value: '', label: 'Todas as especialidades' },
    ...specialties.map((s) => ({ value: s, label: s })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <SlidersHorizontal size={13} />
        <span>Filtros</span>
      </div>

      {/* Período como pills */}
      <div className="flex rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('period', opt.value)}
            className={[
              'px-3 py-1.5 text-xs font-medium transition-colors',
              period === opt.value
                ? 'bg-cyan-500 text-gray-900'
                : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Especialidade */}
      <select
        value={specialty}
        onChange={(e) => update('specialty', e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs
                   text-slate-300 outline-none focus:border-cyan-500 cursor-pointer"
      >
        {specialtyOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Tipo de anestesia */}
      <select
        value={anesthesia}
        onChange={(e) => update('anesthesia', e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs
                   text-slate-300 outline-none focus:border-cyan-500 cursor-pointer"
      >
        {ANESTHESIA_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
