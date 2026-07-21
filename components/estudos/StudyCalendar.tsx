'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import type { ReviewWithTopic } from '@/lib/study'

interface Props {
  reviews: ReviewWithTopic[]
  todayKey: string
  overdueDateKeys: Set<string>
  selectedDate: string
  onSelectDate: (date: string) => void
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  const days: Date[] = []
  const cursor = new Date(start)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export default function StudyCalendar({ reviews, todayKey, overdueDateKeys, selectedDate, onSelectDate }: Props) {
  const [todayY, todayM] = todayKey.split('-').map(Number)
  const [viewYear, setViewYear] = useState(todayY)
  const [viewMonth, setViewMonth] = useState(todayM - 1)

  const dayMap = useMemo(() => {
    const map = new Map<string, { pending: number; completed: number; skipped: number }>()
    for (const r of reviews) {
      const entry = map.get(r.scheduled_date) ?? { pending: 0, completed: 0, skipped: 0 }
      entry[r.status]++
      map.set(r.scheduled_date, entry)
    }
    return map
  }, [reviews])

  const days = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function goToPrevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }

  function goToNextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  function goToToday() {
    setViewYear(todayY)
    setViewMonth(todayM - 1)
    onSelectDate(todayKey)
  }

  const viewLabel = MONTH_FORMATTER.format(new Date(viewYear, viewMonth, 1))

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 capitalize">{viewLabel}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            aria-label="Mês anterior"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-700 hover:text-slate-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-gray-700 hover:text-slate-100 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Próximo mês"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-700 hover:text-slate-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-600 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const key = toDateKey(date)
          const inMonth = date.getMonth() === viewMonth
          const isToday = key === todayKey
          const isSelected = key === selectedDate
          const counts = dayMap.get(key)
          const isOverdue = overdueDateKeys.has(key)

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              disabled={!inMonth}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-xs transition-colors
                ${!inMonth ? 'text-slate-700 cursor-default' : 'text-slate-300 hover:bg-gray-700'}
                ${isSelected ? 'bg-cyan-500/20 ring-1 ring-cyan-500' : ''}
                ${isToday && !isSelected ? 'ring-1 ring-slate-600' : ''}
                ${isOverdue && inMonth ? 'text-amber-400' : ''}`}
            >
              <span className={isToday ? 'font-bold text-cyan-400' : ''}>{date.getDate()}</span>
              {inMonth && counts && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOverdue ? 'bg-amber-400' : counts.pending > 0 ? 'bg-cyan-400' : 'bg-slate-600'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
