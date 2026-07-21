'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { CheckCircle2, BookOpen, Calendar, FileText } from 'lucide-react'
import { createStudySession } from '@/app/actions/study'
import TopicSelect, { type TopicOption } from './TopicSelect'

interface Props {
  topics: TopicOption[]
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function NovaSessaoForm({ topics }: Props) {
  const [topicId, setTopicId] = useState('')
  const [studiedAt, setStudiedAt] = useState(todayISO())
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTopicId('')
    setStudiedAt(todayISO())
    setSource('')
    setNotes('')
    setError(null)
    setSuccess(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!topicId) { setError('Selecione um tema.'); return }
    if (!studiedAt) { setError('Informe a data em que estudou.'); return }

    startTransition(async () => {
      const result = await createStudySession(topicId, studiedAt, notes || null, source || null)
      if (result?.error) { setError(result.error); return }
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="rounded-2xl bg-emerald-500/10 p-3">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Estudo registrado!</p>
          <p className="text-xs text-slate-400 mt-1">Suas próximas revisões foram agendadas.</p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={reset}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-slate-300 hover:bg-gray-800 transition-colors"
          >
            Registrar outro
          </button>
          <Link
            href="/dashboard/estudos"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 transition-colors"
          >
            Ver revisões
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-gray-700 bg-gray-800 p-5">
      <TopicSelect topics={topics} value={topicId} onChange={setTopicId} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Data do estudo</label>
        <div className="relative">
          <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="date"
            value={studiedAt}
            max={todayISO()}
            onChange={(e) => setStudiedAt(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-9 pr-4 py-2.5
                       text-sm text-slate-100 outline-none [color-scheme:dark]
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Fonte/material <span className="text-slate-500 font-normal">(opcional)</span>
        </label>
        <div className="relative">
          <FileText size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ex: Miller, aula X, artigo Y..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-9 pr-4 py-2.5
                       text-sm text-slate-100 placeholder:text-slate-500 outline-none
                       focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">
          Anotações <span className="text-slate-500 font-normal">(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Pontos importantes, dúvidas..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2.5
                     text-sm text-slate-100 placeholder:text-slate-500 outline-none resize-none
                     focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm
                   font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        ) : (
          <BookOpen size={14} />
        )}
        Registrar estudo
      </button>
    </form>
  )
}
