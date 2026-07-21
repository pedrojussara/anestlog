import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getReviewTasksWithTopic, getStudySessionsWithProgress } from '@/lib/study'
import { todayISODate } from '@/lib/study-scheduler'
import EstudosClient from '@/components/estudos/EstudosClient'
import StudySessionsList from '@/components/estudos/StudySessionsList'

export default async function EstudosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [reviews, sessions] = await Promise.all([
    getReviewTasksWithTopic(supabase, user.id),
    getStudySessionsWithProgress(supabase, user.id),
  ])
  const todayKey = todayISODate()
  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-cyan-500/10 p-1.5">
            <BookOpen size={16} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Estudos</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} ${pendingCount > 1 ? 'revisões pendentes' : 'revisão pendente'}`
                : 'Nenhuma revisão pendente'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/estudos/novo"
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2.5 text-sm
                     font-semibold text-gray-900 hover:bg-cyan-400 transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Registrar estudo</span>
        </Link>
      </div>

      <EstudosClient reviews={reviews} todayKey={todayKey} />

      <StudySessionsList sessions={sessions} />
    </div>
  )
}
