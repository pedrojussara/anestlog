'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { SPECIALTIES } from '@/lib/constants'

interface Props {
  value: string
  onChange: (value: string) => void
}

const CUSTOM_VALUE = '__custom__'

export default function SpecialtySelect({ value, onChange }: Props) {
  const isCustom = value !== '' && !SPECIALTIES.includes(value as typeof SPECIALTIES[number])
  const [showCustom, setShowCustom] = useState(isCustom)

  function handleSelectChange(val: string) {
    if (val === CUSTOM_VALUE) {
      setShowCustom(true)
      onChange('')
    } else {
      setShowCustom(false)
      onChange(val)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <select
          value={showCustom ? CUSTOM_VALUE : value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-gray-600 bg-gray-900
                     px-4 py-2.5 pr-10 text-sm text-slate-100 outline-none
                     focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
        >
          <option value="" disabled className="bg-gray-900">Selecione a especialidade...</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s} className="bg-gray-900">{s}</option>
          ))}
          <option value={CUSTOM_VALUE} className="bg-gray-900 text-cyan-400">
            + Adicionar nova especialidade...
          </option>
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

      {showCustom && (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nome da especialidade..."
            autoFocus
            className="w-full rounded-lg border border-cyan-500/40 bg-gray-900 px-4 py-2.5
                       pr-10 text-sm text-slate-100 placeholder:text-slate-600 outline-none
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <Plus size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500" />
        </div>
      )}
    </div>
  )
}
