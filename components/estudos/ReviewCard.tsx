'use client'

import type { ReactNode } from 'react'
import { Layers, ListChecks, ClipboardList, FileText, BookOpenCheck, Check, X as XIcon } from 'lucide-react'
import type { DifficultyRating, ReviewTaskType, ReviewWithTopic } from '@/lib/study'

const TASK_TYPE_CONFIG: Record<ReviewTaskType, { label: string; icon: ReactNode }> = {
  flashcards:          { label: 'Flashcards',            icon: <Layers size={13} /> },
  questoes:            { label: 'Questões',              icon: <ListChecks size={13} /> },
  flashcards_questoes: { label: 'Flashcards + Questões', icon: <BookOpenCheck size={13} /> },
  simulado:            { label: 'Simulado',              icon: <ClipboardList size={13} /> },
  revisao_resumo:      { label: 'Revisão do resumo',     icon: <FileText size={13} /> },
}

const STATUS_BADGE = {
  completed: { label: 'Concluída', className: 'bg-emerald-500/15 text-emerald-400' },
  skipped:   { label: 'Pulada',    className: 'bg-gray-700 text-slate-500' },
} as const

const VARIANT_STYLE = {
  today:    'border-gray-700 bg-gray-800',
  overdue:  'border-amber-500/30 bg-amber-500/5',
  calendar: 'border-gray-700 bg-gray-800',
} as const

interface Props {
  review: ReviewWithTopic
  variant: 'today' | 'overdue' | 'calendar'
  daysOverdue?: number
  isBusy: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onComplete: (difficulty: DifficultyRating) => void
  onSkip: () => void
}

export default function ReviewCard({
  review, variant, daysOverdue, isBusy, isExpanded, onToggleExpand, onComplete, onSkip,
}: Props) {
  const taskConfig = TASK_TYPE_CONFIG[review.task_type]
  const isPending = review.status === 'pending'

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 ${VARIANT_STYLE[variant]} ${isBusy ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 leading-tight truncate">{review.topic_name}</p>
          <p className="text-xs text-slate-500">{review.topic_area}</p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-gray-700/80 px-2 py-0.5 text-[10px] font-bold text-slate-400">
          R{review.review_number}
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
          {taskConfig.icon}
          {taskConfig.label}
        </span>
        {review.suggested_questions != null && (
          <span className="text-xs text-slate-500">{review.suggested_questions} questões</span>
        )}
        {variant === 'overdue' && daysOverdue !== undefined && (
          <span className="text-xs font-semibold text-amber-400">
            {daysOverdue === 1 ? 'há 1 dia' : `há ${daysOverdue} dias`}
          </span>
        )}
        {review.status !== 'pending' && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[review.status].className}`}>
            {STATUS_BADGE[review.status].label}
          </span>
        )}
      </div>

      {isPending && (
        isExpanded ? (
          <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900/60 p-2.5">
            <p className="text-xs text-slate-400">Como foi a revisão?</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => onComplete('dificil')}
                disabled={isBusy}
                className="flex-1 rounded-lg bg-red-500/15 px-2 py-1.5 text-xs font-semibold text-red-400
                           hover:bg-red-500/25 disabled:opacity-50 transition-colors"
              >
                Difícil
              </button>
              <button
                onClick={() => onComplete('medio')}
                disabled={isBusy}
                className="flex-1 rounded-lg bg-yellow-500/15 px-2 py-1.5 text-xs font-semibold text-yellow-400
                           hover:bg-yellow-500/25 disabled:opacity-50 transition-colors"
              >
                Médio
              </button>
              <button
                onClick={() => onComplete('facil')}
                disabled={isBusy}
                className="flex-1 rounded-lg bg-emerald-500/15 px-2 py-1.5 text-xs font-semibold text-emerald-400
                           hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
              >
                Fácil
              </button>
            </div>
            <button
              onClick={onToggleExpand}
              disabled={isBusy}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-start"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onToggleExpand}
              disabled={isBusy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2
                         text-xs font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
            >
              <Check size={13} />
              Concluir
            </button>
            <button
              onClick={onSkip}
              disabled={isBusy}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2
                         text-xs font-medium text-slate-400 hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <XIcon size={13} />
              Pular
            </button>
          </div>
        )
      )}
    </div>
  )
}
