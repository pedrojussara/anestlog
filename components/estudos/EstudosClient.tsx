'use client'

import { useMemo, useState, useTransition } from 'react'
import { CalendarCheck, Clock3, PartyPopper } from 'lucide-react'
import { completeReview, skipReview } from '@/app/actions/study'
import type { DifficultyRating, ReviewWithTopic } from '@/lib/study'
import ReviewCard from './ReviewCard'
import StudyCalendar from './StudyCalendar'

interface Props {
  reviews: ReviewWithTopic[]
  todayKey: string
}

function daysBetween(fromISO: string, toISO: string): number {
  const [ay, am, ad] = fromISO.split('-').map(Number)
  const [by, bm, bd] = toISO.split('-').map(Number)
  const a = Date.UTC(ay, am - 1, ad)
  const b = Date.UTC(by, bm - 1, bd)
  return Math.round((b - a) / 86400000)
}

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

export default function EstudosClient({ reviews, todayKey }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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

  const selectedDayReviews = useMemo(
    () => reviews
      .filter((r) => r.scheduled_date === selectedDate)
      .sort((a, b) => a.review_number - b.review_number),
    [reviews, selectedDate]
  )

  function handleComplete(reviewId: string, difficulty: DifficultyRating) {
    setActionError(null)
    setPendingId(reviewId)
    startTransition(async () => {
      const result = await completeReview(reviewId, difficulty)
      setPendingId(null)
      setExpandedId(null)
      if (result?.error) setActionError(result.error)
    })
  }

  function handleSkip(reviewId: string) {
    setActionError(null)
    setPendingId(reviewId)
    startTransition(async () => {
      const result = await skipReview(reviewId)
      setPendingId(null)
      if (result?.error) setActionError(result.error)
    })
  }

  function reviewVariant(review: ReviewWithTopic): 'today' | 'overdue' | 'calendar' {
    if (review.status === 'pending' && review.scheduled_date < todayKey) return 'overdue'
    if (review.scheduled_date === todayKey) return 'today'
    return 'calendar'
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {actionError}
        </p>
      )}

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
            {todayReviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                variant="today"
                isBusy={isPending && pendingId === r.id}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onComplete={(d) => handleComplete(r.id, d)}
                onSkip={() => handleSkip(r.id)}
              />
            ))}
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
            {overdueReviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                variant="overdue"
                daysOverdue={daysBetween(r.scheduled_date, todayKey)}
                isBusy={isPending && pendingId === r.id}
                isExpanded={expandedId === r.id}
                onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onComplete={(d) => handleComplete(r.id, d)}
                onSkip={() => handleSkip(r.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Calendário */}
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
              {selectedDayReviews.map((r) => {
                const variant = reviewVariant(r)
                return (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    variant={variant}
                    daysOverdue={variant === 'overdue' ? daysBetween(r.scheduled_date, todayKey) : undefined}
                    isBusy={isPending && pendingId === r.id}
                    isExpanded={expandedId === r.id}
                    onToggleExpand={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    onComplete={(d) => handleComplete(r.id, d)}
                    onSkip={() => handleSkip(r.id)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
