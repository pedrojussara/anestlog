'use client'

import { useMemo, useState, useTransition } from 'react'
import { CalendarCheck, Clock3, CalendarRange, PartyPopper, X as XIcon, CheckCircle2 } from 'lucide-react'
import { completeReview, skipReview, deleteReviewTask, type CompleteReviewPayload } from '@/app/actions/study'
import { addDays, diffDays } from '@/lib/study-scheduler'
import type { ReviewWithTopic } from '@/lib/study'
import ReviewCard from './ReviewCard'
import StudyCalendar from './StudyCalendar'

interface Props {
  reviews: ReviewWithTopic[]
  todayKey: string
}

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

const UPCOMING_DAYS = 7

export default function EstudosClient({ reviews, todayKey }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [isPending, startTransition] = useTransition()

  const todayReviews = useMemo(
    () => reviews.filter((r) => r.status === 'pending' && r.scheduled_date === todayKey),
    [reviews, todayKey]
  )

  const overdueReviews = useMemo(
    () => reviews
      .filter((r) => r.status === 'pending' && r.scheduled_date < todayKey)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    [reviews, todayKey]
  )

  const overdueDateKeys = useMemo(
    () => new Set(overdueReviews.map((r) => r.scheduled_date)),
    [overdueReviews]
  )

  const upcomingByDay = useMemo(() => {
    const entries: { date: string; reviews: ReviewWithTopic[] }[] = []
    for (let i = 1; i <= UPCOMING_DAYS; i++) {
      const date = addDays(todayKey, i)
      const dayReviews = reviews
        .filter((r) => r.status === 'pending' && r.scheduled_date === date)
        .sort((a, b) => a.review_number - b.review_number)
      if (dayReviews.length > 0) entries.push({ date, reviews: dayReviews })
    }
    return entries
  }, [reviews, todayKey])

  const upcomingCount = useMemo(
    () => upcomingByDay.reduce((sum, e) => sum + e.reviews.length, 0),
    [upcomingByDay]
  )

  const selectedDayReviews = useMemo(
    () => reviews
      .filter((r) => r.scheduled_date === selectedDate)
      .sort((a, b) => a.review_number - b.review_number),
    [reviews, selectedDate]
  )

  function handleComplete(reviewId: string, payload: CompleteReviewPayload) {
    setActionError(null)
    setActionFeedback(null)
    setPendingId(reviewId)
    startTransition(async () => {
      const result = await completeReview(reviewId, payload)
      setPendingId(null)
      if (result?.error) setActionError(result.error)
      else if (result?.feedback) setActionFeedback(result.feedback)
    })
  }

  function handleSkip(reviewId: string) {
    setActionError(null)
    setActionFeedback(null)
    setPendingId(reviewId)
    startTransition(async () => {
      const result = await skipReview(reviewId)
      setPendingId(null)
      if (result?.error) setActionError(result.error)
    })
  }

  function handleDelete(reviewId: string) {
    setActionError(null)
    setActionFeedback(null)
    setPendingId(reviewId)
    startTransition(async () => {
      const result = await deleteReviewTask(reviewId)
      setPendingId(null)
      if (result?.error) setActionError(result.error)
    })
  }

  function reviewVariant(review: ReviewWithTopic): 'today' | 'overdue' | 'upcoming' | 'calendar' {
    if (review.status === 'pending' && review.scheduled_date < todayKey) return 'overdue'
    if (review.scheduled_date === todayKey) return 'today'
    return 'calendar'
  }

  function renderCard(r: ReviewWithTopic, variant: 'today' | 'overdue' | 'upcoming' | 'calendar') {
    return (
      <ReviewCard
        key={r.id}
        review={r}
        variant={variant}
        daysOverdue={variant === 'overdue' ? diffDays(r.scheduled_date, todayKey) : undefined}
        isBusy={isPending && pendingId === r.id}
        onComplete={(payload) => handleComplete(r.id, payload)}
        onSkip={() => handleSkip(r.id)}
        onDelete={() => handleDelete(r.id)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {actionError}
        </p>
      )}

      {actionFeedback && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-emerald-400" />
          <p className="flex-1">{actionFeedback}</p>
          <button
            onClick={() => setActionFeedback(null)}
            className="flex-shrink-0 text-emerald-400/70 hover:text-emerald-300 transition-colors"
          >
            <XIcon size={13} />
          </button>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Hoje', value: todayReviews.length, icon: CalendarCheck, accent: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Atrasadas', value: overdueReviews.length, icon: Clock3, accent: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Próximos 7 dias', value: upcomingCount, icon: CalendarRange, accent: 'text-violet-400', bg: 'bg-violet-500/10' },
        ].map(({ label, value, icon: Icon, accent, bg }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border border-gray-700 bg-gray-800 p-3 sm:p-4">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
              <Icon size={14} className={accent} />
            </div>
            <div>
              <p className={`text-xl sm:text-2xl font-bold ${accent}`}>{value}</p>
              <p className="text-[11px] sm:text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hoje */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={15} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200">Hoje</h2>
        </div>

        {todayReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-700 bg-gray-800/40 py-10 text-center">
            <PartyPopper size={24} className="text-emerald-400" />
            <p className="text-sm font-medium text-slate-300">Nenhuma revisão para hoje</p>
            <p className="text-xs text-slate-600">Você está em dia com seus estudos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {todayReviews.map((r) => renderCard(r, 'today'))}
          </div>
        )}
      </section>

      {/* Atrasadas */}
      {overdueReviews.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock3 size={15} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Atrasadas</h2>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
              {overdueReviews.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {overdueReviews.map((r) => renderCard(r, 'overdue'))}
          </div>
        </section>
      )}

      {/* Próximos 7 dias */}
      {upcomingByDay.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <CalendarRange size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-200">Próximos 7 dias</h2>
          </div>

          {upcomingByDay.map(({ date, reviews: dayReviews }) => (
            <div key={date} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-slate-500 capitalize">{formatDatePt(date)}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {dayReviews.map((r) => renderCard(r, 'upcoming'))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Calendário — planejamento de longo prazo */}
      <section className="flex flex-col gap-3">
        <StudyCalendar
          reviews={reviews}
          todayKey={todayKey}
          overdueDateKeys={overdueDateKeys}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {selectedDayReviews.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-500">
              {selectedDayReviews.length} {selectedDayReviews.length > 1 ? 'revisões' : 'revisão'} em {formatDatePt(selectedDate)}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedDayReviews.map((r) => renderCard(r, reviewVariant(r)))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
