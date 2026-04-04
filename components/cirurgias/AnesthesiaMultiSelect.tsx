'use client'

import type { AnesthesiaType } from '@/types'
import { ANESTHESIA_LABELS } from '@/lib/anesthesia'

interface Props {
  selected: AnesthesiaType[]
  onChange: (types: AnesthesiaType[]) => void
}

export default function AnesthesiaMultiSelect({ selected, onChange }: Props) {
  function toggle(type: AnesthesiaType) {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(ANESTHESIA_LABELS) as [AnesthesiaType, string][]).map(([type, label]) => {
        const active = selected.includes(type)
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              active
                ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                : 'border-gray-600 bg-gray-800 text-slate-400 hover:border-gray-500 hover:text-slate-200',
            ].join(' ')}
          >
            {active && <span className="mr-1">✓</span>}
            {label}
          </button>
        )
      })}
    </div>
  )
}
