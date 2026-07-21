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
      'id, session_id, topic_id, scheduled_date, review_number, task_type, suggested_questions, status, difficulty_rating, study_topics(name, area)'
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
    status: r.status,
    difficulty_rating: r.difficulty_rating,
    topic_name: r.study_topics?.name ?? 'Tema removido',
    topic_area: r.study_topics?.area ?? '—',
  }))
}
