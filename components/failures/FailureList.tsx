'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Wind, Calendar, Stethoscope, FileText } from 'lucide-react'
import type { FailureItem } from '@/lib/failures'
import { ANESTHESIA_LABELS } from '@/lib/anesthesia'
import type { AnesthesiaType } from '@/types'

interface Props {
  failures: FailureItem[]
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByMonth(failures: FailureItem[]): [string, FailureItem[]][] {
  const map = new Map<string, FailureItem[]>()
  for (const f of failures) {
    const key = f.surgery_date.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(f)
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
}

function formatMonthHeader(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric',
  })
}

export default function FailureList({ failures }: Props) {
  if (failures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <span className="text-3xl">🎉</span>
        <p className="text-sm font-medium text-emerald-400">Nenhuma falha no período!</p>
        <p className="text-xs text-slate-600">Continue assim — excelente desempenho</p>
      </div>
    )
  }

  const groups = groupByMonth(failures)

  return (
    <div className="flex flex-col gap-6">
      {groups.map(([monthKey, items]) => (
        <div key={monthKey} className="flex flex-col gap-2">
          {/* Month header */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold capitalize text-slate-500">
              {formatMonthHeader(monthKey)}
            </span>
            <div className="flex-1 border-t border-gray-800" />
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
              {items.length} falha{items.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            {items.map((f) => (
              <FailureCard key={f.id} failure={f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FailureCard({ failure }: { failure: FailureItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={[
        'rounded-xl border transition-all overflow-hidden',
        failure.is_difficult_airway
          ? 'border-orange-500/30 bg-orange-500/5'
          : 'border-red-500/20 bg-red-500/5',
      ].join(' ')}
    >
      {/* Main row — always visible, clickable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Red dot */}
        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />

        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-200">{failure.label}</span>
            {failure.is_difficult_airway && (
              <span className="flex items-center gap-1 rounded-full border border-orange-500/30
                               bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">
                <Wind size={10} />
                Via aérea difícil
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              <span className="capitalize">{formatDate(failure.surgery_date)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Stethoscope size={10} />
              {failure.surgery_specialty}
            </span>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-slate-600">
          {failure.notes && (
            <span className="flex items-center gap-1 text-slate-500">
              <FileText size={11} />
              <span className="hidden sm:inline">observação</span>
            </span>
          )}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-700/60 bg-gray-900/60 px-4 py-3 flex flex-col gap-3">
          {/* Anesthesia pills */}
          {failure.surgery_anesthesia_types.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {failure.surgery_anesthesia_types.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10
                             px-2 py-0.5 text-xs text-cyan-400"
                >
                  {ANESTHESIA_LABELS[type as AnesthesiaType] ?? type}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {failure.notes ? (
            <div className="flex gap-2">
              <FileText size={13} className="flex-shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Observações do residente
                </p>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {failure.notes}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-slate-600">Sem observações registradas para este procedimento.</p>
          )}
        </div>
      )}
    </div>
  )
}
