'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Search, ChevronDown, Plus, Check } from 'lucide-react'
import { createCustomTopic } from '@/app/actions/study'
import { STUDY_AREAS } from '@/lib/constants'
import type { StudyArea } from '@/types'

export interface TopicOption {
  id: string
  name: string
  area: string
  is_custom: boolean
}

interface Props {
  topics: TopicOption[]
  value: string
  onChange: (topicId: string) => void
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function TopicSelect({ topics: initialTopics, value, onChange }: Props) {
  const [topics, setTopics] = useState(initialTopics)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newArea, setNewArea] = useState<StudyArea | ''>('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = topics.find((t) => t.id === value) ?? null

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const groups = useMemo(() => {
    const q = normalize(query)
    return STUDY_AREAS
      .map((area) => ({
        area,
        items: topics.filter((t) => t.area === area && (!q || normalize(t.name).includes(q))),
      }))
      .filter((g) => g.items.length > 0)
  }, [topics, query])

  const hasMatches = groups.length > 0

  function handleSelect(topic: TopicOption) {
    onChange(topic.id)
    setQuery('')
    setOpen(false)
    setCreating(false)
  }

  function handleCreate() {
    setCreateError(null)
    if (!query.trim()) { setCreateError('Digite o nome do tema.'); return }
    if (!newArea) { setCreateError('Selecione a área.'); return }

    startTransition(async () => {
      const result = await createCustomTopic(query.trim(), newArea as StudyArea)
      if (result?.error) { setCreateError(result.error); return }
      if (result?.topicId) {
        const created: TopicOption = { id: result.topicId, name: query.trim(), area: newArea, is_custom: true }
        setTopics((prev) => [...prev, created])
        setNewArea('')
        handleSelect(created)
      }
    })
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">Tema</label>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={open ? query : (selected?.name ?? '')}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setCreating(false) }}
          onFocus={() => { setOpen(true); setQuery('') }}
          placeholder="Buscar tema..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-9 pr-9 py-2.5
                     text-sm text-slate-100 placeholder:text-slate-500 outline-none
                     focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
      </div>

      {open && (
        <div className="absolute top-full z-20 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {groups.map((g) => (
            <div key={g.area}>
              <div className="sticky top-0 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-500 border-b border-slate-800">
                {g.area}
              </div>
              {g.items.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm
                    hover:bg-slate-800 transition-colors
                    ${t.id === value ? 'text-cyan-400' : 'text-slate-200'}`}
                >
                  <span className="truncate">
                    {t.name}
                    {t.is_custom && <span className="ml-1.5 text-[10px] text-slate-500">(personalizado)</span>}
                  </span>
                  {t.id === value && <Check size={13} className="flex-shrink-0" />}
                </button>
              ))}
            </div>
          ))}

          {!hasMatches && !creating && (
            <p className="px-3 py-3 text-xs text-slate-500">Nenhum tema encontrado.</p>
          )}

          <div className="border-t border-slate-800 p-2">
            {creating ? (
              <div className="flex flex-col gap-2 p-1">
                <p className="text-xs text-slate-400">
                  Criar tema personalizado: <span className="text-slate-200 font-medium">{query || '(sem nome)'}</span>
                </p>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value as StudyArea | '')}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm
                             text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="">Selecione a área...</option>
                  {STUDY_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {createError && <p className="text-xs text-red-400">{createError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-900
                               hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? 'Criando...' : 'Criar e selecionar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                <Plus size={14} />
                Criar tema personalizado{query.trim() ? `: "${query.trim()}"` : ''}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
