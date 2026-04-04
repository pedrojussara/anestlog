'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { SPECIALTIES } from '@/lib/constants'
import { ANESTHESIA_LABELS } from '@/lib/anesthesia'
import type { AnesthesiaType } from '@/types'

const PERIOD_OPTIONS = [
  { value: 'all',   label: 'Todo período' },
  { value: 'week',  label: 'Última semana' },
  { value: 'month', label: 'Último mês' },
  { value: 'year',  label: 'Último ano' },
]

const STATUS_OPTIONS = [
  { value: '',         label: 'Todos' },
  { value: 'success',  label: 'Sucesso' },
  { value: 'failure',  label: 'Falha' },
]

export default function CirurgiasFilters({ totalShown, total }: { totalShown: number; total: number }) {
  const router = useRouter()
  const params = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  // Controlled search with debounce
  const [searchValue, setSearchValue] = useState(params.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page') // reset to page 1 on filter change
      router.push(`/dashboard/cirurgias?${next.toString()}`)
    },
    [router, params]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      update('search', searchValue)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const specialty  = params.get('specialty') ?? ''
  const anesthesia = params.get('anesthesia') ?? ''
  const period     = params.get('period') ?? 'all'
  const status     = params.get('status') ?? ''

  const activeFilters = [specialty, anesthesia, period !== 'all' ? period : '', status].filter(Boolean).length

  function clearAll() {
    setSearchValue('')
    router.push('/dashboard/cirurgias')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar + toggle filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar por especialidade, procedimento, observação..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-4
                       text-sm text-slate-100 placeholder:text-slate-600 outline-none
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={[
            'flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors',
            showFilters || activeFilters > 0
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
              : 'border-gray-700 bg-gray-800 text-slate-400 hover:text-slate-200',
          ].join(' ')}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-gray-900">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-700 bg-gray-800/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Período */}
          <FilterSelect
            label="Período"
            value={period}
            onChange={(v) => update('period', v)}
            options={PERIOD_OPTIONS}
          />

          {/* Especialidade */}
          <FilterSelect
            label="Especialidade"
            value={specialty}
            onChange={(v) => update('specialty', v)}
            options={[
              { value: '', label: 'Todas' },
              ...SPECIALTIES.map((s) => ({ value: s, label: s })),
            ]}
          />

          {/* Tipo de anestesia */}
          <FilterSelect
            label="Tipo de anestesia"
            value={anesthesia}
            onChange={(v) => update('anesthesia', v)}
            options={[
              { value: '', label: 'Todos' },
              ...(Object.entries(ANESTHESIA_LABELS) as [AnesthesiaType, string][]).map(
                ([value, label]) => ({ value, label })
              ),
            ]}
          />

          {/* Status */}
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => update('status', v)}
            options={STATUS_OPTIONS}
          />
        </div>
      )}

      {/* Resumo + limpar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {totalShown === total
            ? `${total} cirurgia${total !== 1 ? 's' : ''}`
            : `${totalShown} de ${total} cirurgia${total !== 1 ? 's' : ''}`}
        </span>
        {(activeFilters > 0 || searchValue) && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors"
          >
            <X size={12} />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-900
                     px-3 py-2 pr-8 text-xs text-slate-300 outline-none
                     focus:border-cyan-500 cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-gray-900">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  )
}
