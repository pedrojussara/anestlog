'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  buildInitialReviewSchedule,
  buildMaintenanceSchedule,
  rescheduleFutureReviews,
  computeDifficultyFromScore,
  todayISODate,
  diffDays,
  DEFAULT_MAX_DAILY_REVIEWS,
  DEFAULT_DIFFICULTY,
  DIFFICULTY_LABELS,
  MIN_SAMPLE_SIZE,
  REVIEW_PLAN,
  type DifficultyRating,
  type PendingReview,
  type RescheduledReview,
  type ScheduledReview,
} from '@/lib/study-scheduler'
import type { StudyArea } from '@/types'

const LAST_INITIAL_REVIEW_NUMBER = REVIEW_PLAN[REVIEW_PLAN.length - 1].reviewNumber

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any

async function getMaxDailyReviews(db: AnySupabaseClient, userId: string): Promise<number> {
  const { data } = await db
    .from('study_settings')
    .select('max_daily_reviews')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.max_daily_reviews ?? DEFAULT_MAX_DAILY_REVIEWS
}

function makeDailyCountFetcher(db: AnySupabaseClient, userId: string) {
  return async (date: string) => {
    const { count } = await db
      .from('review_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('scheduled_date', date)
    return count ?? 0
  }
}

export async function createStudySession(
  topicId: string,
  studiedAt: string,
  notes?: string | null,
  source?: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (!topicId) return { error: 'Tema obrigatório.' }
  if (!studiedAt) return { error: 'Data de estudo obrigatória.' }

  const db = supabase as AnySupabaseClient

  const { data: session, error: sessionError } = await db
    .from('study_sessions')
    .insert({
      user_id: user.id,
      topic_id: topicId,
      studied_at: studiedAt,
      notes: notes || null,
      source: source || null,
    })
    .select('id')
    .single()

  if (sessionError) return { error: 'Erro ao registrar sessão de estudo.' }

  const maxDailyReviews = await getMaxDailyReviews(db, user.id)
  const getExistingCount = makeDailyCountFetcher(db, user.id)

  const schedule = await buildInitialReviewSchedule(studiedAt, maxDailyReviews, getExistingCount)

  const { error: reviewsError } = await db.from('review_tasks').insert(
    schedule.map((r) => ({
      user_id: user.id,
      session_id: session.id,
      topic_id: topicId,
      scheduled_date: r.scheduledDate,
      review_number: r.reviewNumber,
      task_type: r.taskType,
      suggested_questions: r.suggestedQuestions,
      suggested_flashcards: r.suggestedFlashcards,
    }))
  )

  if (reviewsError) return { error: 'Erro ao agendar revisões.' }

  revalidatePath('/dashboard/estudos')
  return { sessionId: session.id as string }
}

export type CompleteReviewPayload =
  | { mode: 'self'; difficultyRating: DifficultyRating }
  | { mode: 'score'; questionsCorrect: number; questionsTotal: number }

export async function completeReview(reviewId: string, payload: CompleteReviewPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const db = supabase as AnySupabaseClient

  const { data: review, error: reviewFetchError } = await db
    .from('review_tasks')
    .select('id, session_id, topic_id, review_number, status, task_type')
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (reviewFetchError || !review) return { error: 'Revisão não encontrada.' }
  if (review.status !== 'pending') return { error: 'Esta revisão já foi concluída ou pulada.' }

  const isFlashcardsOnly = review.task_type === 'flashcards'
  if (isFlashcardsOnly && payload.mode !== 'self') {
    return { error: 'Esta revisão é avaliada por autoavaliação (Difícil/Médio/Fácil).' }
  }
  if (!isFlashcardsOnly && payload.mode !== 'score') {
    return { error: 'Informe o resultado das questões (acertos e total).' }
  }

  const completedAt = todayISODate()
  const updatePayload: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
  }

  let resultDifficulty: DifficultyRating
  let feedbackHead: string

  if (payload.mode === 'self') {
    if (!['dificil', 'medio', 'facil'].includes(payload.difficultyRating)) {
      return { error: 'Avaliação de dificuldade inválida.' }
    }
    resultDifficulty = payload.difficultyRating
    updatePayload.difficulty_rating = resultDifficulty
    feedbackHead = `Autoavaliação: ${DIFFICULTY_LABELS[resultDifficulty]}.`
  } else {
    const { questionsCorrect, questionsTotal } = payload
    if (
      !Number.isInteger(questionsCorrect) || !Number.isInteger(questionsTotal) ||
      questionsTotal < 1 || questionsCorrect < 0 || questionsCorrect > questionsTotal
    ) {
      return { error: 'Informe valores válidos (acertos ≤ total, total ≥ 1).' }
    }

    const { data: sessionRow } = await db
      .from('study_sessions')
      .select('current_difficulty')
      .eq('id', review.session_id)
      .single()

    const previousDifficulty: DifficultyRating = sessionRow?.current_difficulty ?? DEFAULT_DIFFICULTY

    if (review.task_type === 'questoes') {
      // Única revisão que afere/reafere a faixa vigente do tema
      const outcome = computeDifficultyFromScore(questionsCorrect, questionsTotal, previousDifficulty)
      resultDifficulty = outcome.difficulty

      if (!outcome.lowSample) {
        const { error: settingsError } = await db
          .from('study_sessions')
          .update({ current_difficulty: resultDifficulty })
          .eq('id', review.session_id)
        if (settingsError) return { error: 'Erro ao atualizar faixa de dificuldade.' }
      }

      feedbackHead = outcome.lowSample
        ? `${outcome.percentage}% — faixa ${DIFFICULTY_LABELS[resultDifficulty]} mantida (amostra pequena, mínimo ${MIN_SAMPLE_SIZE} questões).`
        : `${outcome.percentage}% — faixa ${DIFFICULTY_LABELS[resultDifficulty]}.`
    } else {
      // flashcards_questoes / simulado / revisao_resumo: registra o resultado
      // mas não redefine a faixa vigente do tema (isso é papel exclusivo das
      // revisões de questões puras)
      const percentage = Math.round((questionsCorrect / questionsTotal) * 100)
      resultDifficulty = previousDifficulty
      feedbackHead = `${percentage}% — faixa ${DIFFICULTY_LABELS[resultDifficulty]} (mantida).`
    }

    updatePayload.questions_correct = questionsCorrect
    updatePayload.questions_total = questionsTotal
    updatePayload.difficulty_rating = resultDifficulty
  }

  const { error: updateError } = await db.from('review_tasks').update(updatePayload).eq('id', reviewId)
  if (updateError) return { error: 'Erro ao concluir revisão.' }

  const { data: pendingRaw } = await db
    .from('review_tasks')
    .select('id, review_number, scheduled_date')
    .eq('session_id', review.session_id)
    .eq('status', 'pending')
    .gt('review_number', review.review_number)

  const pendingReviews: PendingReview[] = (pendingRaw ?? []).map(
    (r: { id: string; review_number: number; scheduled_date: string }) => ({
      id: r.id,
      reviewNumber: r.review_number,
      scheduledDate: r.scheduled_date,
    })
  )

  const maxDailyReviews = await getMaxDailyReviews(db, user.id)
  const getExistingCount = makeDailyCountFetcher(db, user.id)

  let rescheduled: RescheduledReview[] = []
  if (pendingReviews.length > 0) {
    rescheduled = await rescheduleFutureReviews(
      review.review_number,
      completedAt,
      resultDifficulty,
      pendingReviews,
      maxDailyReviews,
      getExistingCount
    )

    for (const r of rescheduled) {
      const { error } = await db
        .from('review_tasks')
        .update({ scheduled_date: r.scheduledDate, suggested_flashcards: r.suggestedFlashcards })
        .eq('id', r.id)
      if (error) return { error: 'Erro ao reagendar revisões futuras.' }
    }
  }

  // Após a última revisão do plano inicial, gera manutenção trimestral até a data do TEA
  let maintenanceScheduled: ScheduledReview[] = []
  if (review.review_number === LAST_INITIAL_REVIEW_NUMBER) {
    const { data: settings } = await db
      .from('study_settings')
      .select('tea_exam_date')
      .eq('user_id', user.id)
      .maybeSingle()

    const teaExamDate = settings?.tea_exam_date ?? null

    if (teaExamDate) {
      maintenanceScheduled = await buildMaintenanceSchedule(
        completedAt,
        teaExamDate,
        maxDailyReviews,
        getExistingCount
      )

      if (maintenanceScheduled.length > 0) {
        const { error } = await db.from('review_tasks').insert(
          maintenanceScheduled.map((r) => ({
            user_id: user.id,
            session_id: review.session_id,
            topic_id: review.topic_id,
            scheduled_date: r.scheduledDate,
            review_number: r.reviewNumber,
            task_type: r.taskType,
            suggested_questions: r.suggestedQuestions,
            suggested_flashcards: r.suggestedFlashcards,
          }))
        )
        if (error) return { error: 'Erro ao agendar revisões de manutenção.' }
      }
    }
  }

  revalidatePath('/dashboard/estudos')

  const candidateDates = [
    ...rescheduled.map((r) => r.scheduledDate),
    ...maintenanceScheduled.map((r) => r.scheduledDate),
  ].sort()

  const nextClause = candidateDates.length > 0
    ? (() => {
        const days = diffDays(completedAt, candidateDates[0])
        return ` Próxima revisão em ${days} dia${days === 1 ? '' : 's'}.`
      })()
    : ' Ciclo de revisões deste tema concluído.'

  return { feedback: `${feedbackHead}${nextClause}` }
}

export async function skipReview(reviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const db = supabase as AnySupabaseClient

  const { data: review } = await db
    .from('review_tasks')
    .select('id, status')
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (!review) return { error: 'Revisão não encontrada.' }
  if (review.status !== 'pending') return { error: 'Esta revisão já foi concluída ou pulada.' }

  const { error } = await db
    .from('review_tasks')
    .update({ status: 'skipped' })
    .eq('id', reviewId)

  if (error) return { error: 'Erro ao pular revisão.' }

  revalidatePath('/dashboard/estudos')
}

export async function deleteReviewTask(reviewId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const db = supabase as AnySupabaseClient

  const { data: review } = await db
    .from('review_tasks')
    .select('id')
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (!review) return { error: 'Revisão não encontrada.' }

  const { error } = await db.from('review_tasks').delete().eq('id', reviewId)
  if (error) return { error: 'Erro ao cancelar revisão.' }

  revalidatePath('/dashboard/estudos')
}

export async function deleteStudySession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const db = supabase as AnySupabaseClient

  const { data: session } = await db
    .from('study_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return { error: 'Sessão não encontrada.' }

  // review_tasks referencia session_id com "on delete cascade": as revisões
  // geradas por esta sessão são removidas automaticamente pelo banco.
  const { error } = await db.from('study_sessions').delete().eq('id', sessionId)
  if (error) return { error: 'Erro ao deletar sessão de estudo.' }

  revalidatePath('/dashboard/estudos')
}

export interface StudySettingsInput {
  max_daily_reviews: number
  tea_exam_date?: string | null
  tsa_exam_date?: string | null
}

export async function updateStudySettings(settings: StudySettingsInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (settings.max_daily_reviews < 1) return { error: 'O teto diário deve ser maior que zero.' }

  const db = supabase as AnySupabaseClient

  const { error } = await db.from('study_settings').upsert({
    user_id: user.id,
    max_daily_reviews: settings.max_daily_reviews,
    tea_exam_date: settings.tea_exam_date || null,
    tsa_exam_date: settings.tsa_exam_date || null,
  })

  if (error) return { error: 'Erro ao salvar configurações.' }

  revalidatePath('/dashboard/estudos')
}

export async function createCustomTopic(name: string, area: StudyArea) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (!name?.trim()) return { error: 'Nome do tema obrigatório.' }
  if (!area) return { error: 'Área obrigatória.' }

  const db = supabase as AnySupabaseClient

  const { data: topic, error } = await db
    .from('study_topics')
    .insert({
      name: name.trim(),
      area,
      is_custom: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao criar tema personalizado.' }

  revalidatePath('/dashboard/estudos')
  return { topicId: topic.id as string }
}
