import { BookMarked, Calendar, FileText } from 'lucide-react'
import { DIFFICULTY_LABELS } from '@/lib/study-scheduler'
import type { StudySessionSummary } from '@/lib/study'
import DeleteSessionButton from './DeleteSessionButton'

const DIFFICULTY_BADGE: Record<'dificil' | 'medio' | 'facil', string> = {
  dificil: 'bg-red-500/15 text-red-400',
  medio:   'bg-amber-500/15 text-amber-400',
  facil:   'bg-emerald-500/15 text-emerald-400',
}

function formatDatePt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  sessions: StudySessionSummary[]
}

export default function StudySessionsList({ sessions }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BookMarked size={15} className="text-cyan-400" />
        <h2 className="text-sm font-semibold text-slate-200">Meus estudos registrados</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-700 bg-gray-800/40 py-10 text-center">
          <BookMarked size={24} className="text-slate-600" />
          <p className="text-sm font-medium text-slate-300">Nenhum estudo registrado ainda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4"
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{s.topic_name}</p>
                <p className="text-xs text-slate-500">{s.topic_area}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDatePt(s.studied_at)}
                  </span>
                  {s.source && (
                    <span className="flex items-center gap-1 min-w-0">
                      <FileText size={11} className="flex-shrink-0" />
                      <span className="truncate">{s.source}</span>
                    </span>
                  )}
                </div>

                {(s.current_difficulty || s.last_percentage != null) && (
                  <div className="flex items-center gap-2 mt-1">
                    {s.current_difficulty && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[s.current_difficulty]}`}>
                        {DIFFICULTY_LABELS[s.current_difficulty]}
                      </span>
                    )}
                    {s.last_percentage != null && (
                      <span className="text-xs text-slate-500">{s.last_percentage}% de acerto</span>
                    )}
                  </div>
                )}
              </div>

              <DeleteSessionButton sessionId={s.id} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
