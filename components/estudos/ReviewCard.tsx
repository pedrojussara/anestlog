'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Layers, ListChecks, ClipboardList, FileText, BookOpenCheck,
  Check, X as XIcon, Trash2, AlertTriangle,
} from 'lucide-react'
import { DIFFICULTY_LABELS, type DifficultyRating } from '@/lib/study-scheduler'
import type { ReviewTaskType, ReviewWithTopic } from '@/lib/study'
import type { CompleteReviewPayload } from '@/app/actions/study'

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

const DIFFICULTY_BADGE: Record<DifficultyRating, string> = {
  dificil: 'bg-red-500/15 text-red-400',
  medio:   'bg-amber-500/15 text-amber-400',
  facil:   'bg-emerald-500/15 text-emerald-400',
}

const VARIANT_STYLE = {
  today:    'border-gray-700 bg-gray-800',
  overdue:  'border-amber-500/30 bg-amber-500/5',
  upcoming: 'border-gray-700 bg-gray-800',
  calendar: 'border-gray-700 bg-gray-800',
} as const

function formatSuggestion(review: ReviewWithTopic): string | null {
  const parts: string[] = []
  if (review.suggested_flashcards != null) parts.push(`${review.suggested_flashcards} flashcards`)
  if (review.suggested_questions != null) parts.push(`${review.suggested_questions} questões`)
  return parts.length > 0 ? parts.join(' + ') : null
}

function percentageColor(pct: number): string {
  if (pct < 70) return 'text-red-400'
  if (pct <= 90) return 'text-amber-400'
  return 'text-emerald-400'
}

interface Props {
  review: ReviewWithTopic
  variant: 'today' | 'overdue' | 'upcoming' | 'calendar'
  daysOverdue?: number
  isBusy: boolean
  onComplete: (payload: CompleteReviewPayload) => void
  onSkip: () => void
  onDelete: () => void
}

export default function ReviewCard({
  review, variant, daysOverdue, isBusy, onComplete, onSkip, onDelete,
}: Props) {
  const [panel, setPanel] = useState<'none' | 'complete' | 'delete'>('none')
  const [correctInput, setCorrectInput] = useState('')
  const [totalInput, setTotalInput] = useState(String(review.suggested_questions ?? ''))

  const taskConfig = TASK_TYPE_CONFIG[review.task_type]
  const isPending = review.status === 'pending'
  const needsScore = review.task_type !== 'flashcards'
  const suggestion = formatSuggestion(review)

  const correctNum = correctInput === '' ? NaN : Number(correctInput)
  const totalNum = totalInput === '' ? NaN : Number(totalInput)
  const scoreIsValid =
    Number.isInteger(correctNum) && Number.isInteger(totalNum) &&
    correctNum >= 0 && totalNum >= 1 && correctNum <= totalNum
  const pct = scoreIsValid ? Math.round((correctNum / totalNum) * 100) : null

  function closePanel() {
    setPanel('none')
  }

  function handleConfirmScore() {
    if (!scoreIsValid) return
    onComplete({ mode: 'score', questionsCorrect: correctNum, questionsTotal: totalNum })
  }

  function handleConfirmSelf(rating: DifficultyRating) {
    onComplete({ mode: 'self', difficultyRating: rating })
  }

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
        {suggestion && (
          <span className="text-xs text-slate-500">{suggestion}</span>
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
        {review.status === 'completed' && review.difficulty_rating && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[review.difficulty_rating]}`}>
            {DIFFICULTY_LABELS[review.difficulty_rating]}
          </span>
        )}
      </div>

      {review.status === 'completed' && review.questions_total != null && review.questions_correct != null && (
        <p className="text-xs text-slate-500">
          {review.questions_correct}/{review.questions_total} questões
          {' '}({Math.round((review.questions_correct / review.questions_total) * 100)}%)
        </p>
      )}

      {isPending && panel === 'delete' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5">
          <AlertTriangle size={12} className="flex-shrink-0 text-red-400" />
          <span className="text-xs text-red-300">Cancelar revisão?</span>
          <button
            onClick={onDelete}
            disabled={isBusy}
            className="rounded px-1.5 py-0.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {isBusy ? '...' : 'Sim'}
          </button>
          <button
            onClick={closePanel}
            className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Não
          </button>
        </div>
      )}

      {isPending && panel === 'complete' && (
        needsScore ? (
          <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900/60 p-2.5">
            <p className="text-xs text-slate-400">Quantas questões você acertou?</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={correctInput}
                onChange={(e) => setCorrectInput(e.target.value)}
                placeholder="0"
                className="w-16 rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 text-center text-sm
                           text-slate-100 outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-500">de</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className="w-16 rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 text-center text-sm
                           text-slate-100 outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-500">questões</span>
              {pct !== null && (
                <span className={`ml-auto text-sm font-bold ${percentageColor(pct)}`}>{pct}%</span>
              )}
            </div>
            {!scoreIsValid && (correctInput !== '' || totalInput !== '') && (
              <p className="text-xs text-red-400">Informe valores válidos (acertos ≤ total, total ≥ 1).</p>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={handleConfirmScore}
                disabled={isBusy || !scoreIsValid}
                className="flex-1 rounded-lg bg-cyan-500 px-2 py-1.5 text-xs font-semibold text-gray-900
                           hover:bg-cyan-400 disabled:opacity-50 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={closePanel}
                disabled={isBusy}
                className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900/60 p-2.5">
            <p className="text-xs text-slate-400">Como foi a revisão?</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleConfirmSelf('dificil')}
                disabled={isBusy}
                className="flex-1 rounded-lg bg-red-500/15 px-2 py-1.5 text-xs font-semibold text-red-400
                           hover:bg-red-500/25 disabled:opacity-50 transition-colors"
              >
                Difícil
              </button>
              <button
                onClick={() => handleConfirmSelf('medio')}
                disabled={isBusy}
                className="flex-1 rounded-lg bg-yellow-500/15 px-2 py-1.5 text-xs font-semibold text-yellow-400
                           hover:bg-yellow-500/25 disabled:opacity-50 transition-colors"
              >
                Médio
              </button>
              <button
                onClick={() => handleConfirmSelf('facil')}
                disabled={isBusy}
                className="flex-1 rounded-lg bg-emerald-500/15 px-2 py-1.5 text-xs font-semibold text-emerald-400
                           hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
              >
                Fácil
              </button>
            </div>
            <button
              onClick={closePanel}
              disabled={isBusy}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-start"
            >
              Voltar
            </button>
          </div>
        )
      )}

      {isPending && panel === 'none' && (
        <div className="flex gap-2">
          <button
            onClick={() => setPanel('complete')}
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
            title="Marca como pulada — mantém no histórico"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2
                       text-xs font-medium text-slate-400 hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <XIcon size={13} />
            Pular
          </button>
          <button
            onClick={() => setPanel('delete')}
            disabled={isBusy}
            title="Cancela e remove esta revisão definitivamente"
            className="flex items-center justify-center rounded-lg border border-gray-700 px-2.5 py-2
                       text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
