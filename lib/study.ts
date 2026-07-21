// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

export type ReviewTaskType = 'flashcards' | 'questoes' | 'flashcards_questoes' | 'simulado' | 'revisao_resumo'
export type ReviewStatus = 'pending' | 'completed' | 'skipped'
export type DifficultyRating = 'dificil' | 'medio' | 'facil'

export interface ReviewWithTopic {
  id: string
  session_id: string
  topic_id: string
  scheduled_date: string
  review_number: number
  task_type: ReviewTaskType
  suggested_questions: number | null
  suggested_flashcards: number | null
  questions_correct: number | null
  questions_total: number | null
  status: ReviewStatus
  difficulty_rating: DifficultyRating | null
  topic_name: string
  topic_area: string
}

interface ReviewTaskRow {
  id: string
  session_id: string
  topic_id: string
  scheduled_date: string
  review_number: number
  task_type: ReviewTaskType
  suggested_questions: number | null
  suggested_flashcards: number | null
  questions_correct: number | null
  questions_total: number | null
  status: ReviewStatus
  difficulty_rating: DifficultyRating | null
  study_topics: { name: string; area: string } | null
}

/** Todas as revisões do usuário (qualquer status), com o tema já resolvido via join. */
export async function getReviewTasksWithTopic(
  supabase: AnySupabaseClient,
  userId: string
): Promise<ReviewWithTopic[]> {
  const { data } = await supabase
    .from('review_tasks')
    .select(
      'id, session_id, topic_id, scheduled_date, review_number, task_type, suggested_questions, suggested_flashcards, questions_correct, questions_total, status, difficulty_rating, study_topics(name, area)'
    )
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: true })

  return ((data ?? []) as ReviewTaskRow[]).map((r) => ({
    id: r.id,
    session_id: r.session_id,
    topic_id: r.topic_id,
    scheduled_date: r.scheduled_date,
    review_number: r.review_number,
    task_type: r.task_type,
    suggested_questions: r.suggested_questions,
    suggested_flashcards: r.suggested_flashcards,
    questions_correct: r.questions_correct,
    questions_total: r.questions_total,
    status: r.status,
    difficulty_rating: r.difficulty_rating,
    topic_name: r.study_topics?.name ?? 'Tema removido',
    topic_area: r.study_topics?.area ?? '—',
  }))
}

export interface StudySessionSummary {
  id: string
  topic_id: string
  topic_name: string
  topic_area: string
  studied_at: string
  notes: string | null
  source: string | null
  current_difficulty: DifficultyRating | null
  last_percentage: number | null
}

interface StudySessionRow {
  id: string
  topic_id: string
  studied_at: string
  notes: string | null
  source: string | null
  current_difficulty: DifficultyRating | null
  study_topics: { name: string; area: string } | null
}

interface ScoredReviewRow {
  session_id: string
  questions_correct: number | null
  questions_total: number | null
}

/** Sessões de estudo do usuário, com a faixa vigente e o último % de acerto registrado. */
export async function getStudySessionsWithProgress(
  supabase: AnySupabaseClient,
  userId: string
): Promise<StudySessionSummary[]> {
  const { data: sessionsRaw } = await supabase
    .from('study_sessions')
    .select('id, topic_id, studied_at, notes, source, current_difficulty, study_topics(name, area)')
    .eq('user_id', userId)
    .order('studied_at', { ascending: false })

  const sessions = (sessionsRaw ?? []) as StudySessionRow[]
  if (sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id)
  const { data: scoredRaw } = await supabase
    .from('review_tasks')
    .select('session_id, questions_correct, questions_total, completed_at')
    .in('session_id', sessionIds)
    .not('questions_total', 'is', null)
    .order('completed_at', { ascending: false })

  // A query já vem ordenada por completed_at desc — a primeira ocorrência de
  // cada session_id é, portanto, a mais recente.
  const latestPercentageBySession = new Map<string, number>()
  for (const r of (scoredRaw ?? []) as ScoredReviewRow[]) {
    if (!latestPercentageBySession.has(r.session_id) && r.questions_total) {
      latestPercentageBySession.set(
        r.session_id,
        Math.round(((r.questions_correct ?? 0) / r.questions_total) * 100)
      )
    }
  }

  return sessions.map((s) => ({
    id: s.id,
    topic_id: s.topic_id,
    topic_name: s.study_topics?.name ?? 'Tema removido',
    topic_area: s.study_topics?.area ?? '—',
    studied_at: s.studied_at,
    notes: s.notes,
    source: s.source,
    current_difficulty: s.current_difficulty,
    last_percentage: latestPercentageBySession.get(s.id) ?? null,
  }))
}
