// ============================================================
// AnestLog — Motor de agendamento de revisões (repetição espaçada)
// Lógica pura e testável: recebe callbacks para consultar a carga
// diária já existente no banco, não acessa o Supabase diretamente.
// ============================================================

export type ReviewTaskType =
  | 'flashcards'
  | 'questoes'
  | 'flashcards_questoes'
  | 'simulado'
  | 'revisao_resumo'

export type DifficultyRating = 'dificil' | 'medio' | 'facil'

export interface ReviewPlanItem {
  reviewNumber: number
  intervalDays: number // dias após studied_at
  taskType: ReviewTaskType
  suggestedQuestions: number | null
}

// R1–R7: intervalos fixos a partir da data de estudo.
// R5 combina "25 questões + revisão do resumo": o task_type reflete o modo
// principal (revisao_resumo) e suggested_questions carrega a quantidade de
// questões a fazer junto.
export const REVIEW_PLAN: ReviewPlanItem[] = [
  { reviewNumber: 1, intervalDays: 1,   taskType: 'flashcards',           suggestedQuestions: null },
  { reviewNumber: 2, intervalDays: 3,   taskType: 'flashcards_questoes',  suggestedQuestions: 10 },
  { reviewNumber: 3, intervalDays: 7,   taskType: 'questoes',             suggestedQuestions: 20 },
  { reviewNumber: 4, intervalDays: 15,  taskType: 'flashcards_questoes',  suggestedQuestions: 20 },
  { reviewNumber: 5, intervalDays: 30,  taskType: 'revisao_resumo',       suggestedQuestions: 25 },
  { reviewNumber: 6, intervalDays: 60,  taskType: 'questoes',             suggestedQuestions: 25 },
  { reviewNumber: 7, intervalDays: 120, taskType: 'simulado',             suggestedQuestions: null },
]

export const MAINTENANCE_INTERVAL_DAYS = 90
export const MAINTENANCE_TASK_TYPE: ReviewTaskType = 'simulado'
export const MAINTENANCE_SUGGESTED_QUESTIONS = 30
export const DEFAULT_MAX_DAILY_REVIEWS = 3
export const DEFAULT_LOOKAHEAD_DAYS = 14

export interface ScheduledReview {
  reviewNumber: number
  scheduledDate: string // YYYY-MM-DD
  taskType: ReviewTaskType
  suggestedQuestions: number | null
}

/** Retorna a contagem de revisões já agendadas para o usuário numa data. */
export type DailyCountFetcher = (date: string) => Promise<number>

// ---- Helpers de data (strings YYYY-MM-DD, sem fuso horário) ----

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function todayISODate(): string {
  return new Date().toISOString().split('T')[0]
}

/** Deslocamento (em dias) do número de revisão em relação a studied_at,
 *  incluindo revisões de manutenção (R8+, a cada 90 dias após a R7). */
export function plannedOffsetDays(reviewNumber: number): number {
  const planned = REVIEW_PLAN.find((r) => r.reviewNumber === reviewNumber)
  if (planned) return planned.intervalDays
  const lastPlan = REVIEW_PLAN[REVIEW_PLAN.length - 1]
  return lastPlan.intervalDays + (reviewNumber - lastPlan.reviewNumber) * MAINTENANCE_INTERVAL_DAYS
}

export function difficultyMultiplier(rating: DifficultyRating): number {
  if (rating === 'dificil') return 0.6
  if (rating === 'facil') return 1.5
  return 1
}

/**
 * Encontra a primeira data (a partir de desiredDate) em que a carga diária do
 * usuário fica abaixo de maxDailyReviews, buscando até `lookaheadDays` dias à
 * frente. Se nenhuma data livre for encontrada nesse intervalo, usa a última
 * data verificada (aceita ultrapassar o teto a evitar não agendar a revisão).
 */
export async function findAvailableDate(
  desiredDate: string,
  maxDailyReviews: number,
  getCountForDate: DailyCountFetcher,
  lookaheadDays: number = DEFAULT_LOOKAHEAD_DAYS
): Promise<string> {
  let candidate = desiredDate
  for (let i = 0; i <= lookaheadDays; i++) {
    const count = await getCountForDate(candidate)
    if (count < maxDailyReviews) return candidate
    candidate = addDays(candidate, 1)
  }
  return candidate
}

/**
 * Gera as 7 revisões iniciais de uma sessão de estudo, respeitando o teto
 * diário do usuário. `getExistingCount` deve consultar quantas revisões o
 * usuário já tem agendadas (de qualquer sessão) numa data.
 */
export async function buildInitialReviewSchedule(
  studiedAt: string,
  maxDailyReviews: number,
  getExistingCount: DailyCountFetcher
): Promise<ScheduledReview[]> {
  const batchCounts = new Map<string, number>()
  const countForDate: DailyCountFetcher = async (date) => {
    const existing = await getExistingCount(date)
    return existing + (batchCounts.get(date) ?? 0)
  }

  const scheduled: ScheduledReview[] = []
  for (const item of REVIEW_PLAN) {
    const desired = addDays(studiedAt, item.intervalDays)
    const finalDate = await findAvailableDate(desired, maxDailyReviews, countForDate)
    batchCounts.set(finalDate, (batchCounts.get(finalDate) ?? 0) + 1)
    scheduled.push({
      reviewNumber: item.reviewNumber,
      scheduledDate: finalDate,
      taskType: item.taskType,
      suggestedQuestions: item.suggestedQuestions,
    })
  }
  return scheduled
}

export interface PendingReview {
  id: string
  reviewNumber: number
  scheduledDate: string
}

export interface RescheduledReview {
  id: string
  scheduledDate: string
}

/**
 * Reagenda as revisões futuras pendentes de uma sessão após a conclusão de
 * uma delas, escalando os intervalos originais pelo multiplicador de
 * dificuldade e encadeando a partir da data de conclusão (dificil: ×0.6,
 * medio: ×1, facil: ×1.5). Respeita o teto diário do usuário.
 */
export async function rescheduleFutureReviews(
  completedReviewNumber: number,
  completedAt: string,
  difficultyRating: DifficultyRating,
  pendingReviews: PendingReview[],
  maxDailyReviews: number,
  getExistingCount: DailyCountFetcher
): Promise<RescheduledReview[]> {
  const multiplier = difficultyMultiplier(difficultyRating)
  const batchCounts = new Map<string, number>()
  const countForDate: DailyCountFetcher = async (date) => {
    const existing = await getExistingCount(date)
    return existing + (batchCounts.get(date) ?? 0)
  }

  const ordered = [...pendingReviews].sort((a, b) => a.reviewNumber - b.reviewNumber)

  const results: RescheduledReview[] = []
  let anchorDate = completedAt
  let anchorOffset = plannedOffsetDays(completedReviewNumber)

  for (const review of ordered) {
    const originalGap = plannedOffsetDays(review.reviewNumber) - anchorOffset
    const scaledGap = Math.max(1, Math.round(originalGap * multiplier))
    const desired = addDays(anchorDate, scaledGap)
    const finalDate = await findAvailableDate(desired, maxDailyReviews, countForDate)
    batchCounts.set(finalDate, (batchCounts.get(finalDate) ?? 0) + 1)

    results.push({ id: review.id, scheduledDate: finalDate })

    anchorDate = finalDate
    anchorOffset = plannedOffsetDays(review.reviewNumber)
  }

  return results
}

/**
 * Gera revisões de manutenção trimestrais após a conclusão da R7, até a
 * data do exame TEA configurada. Retorna lista vazia se não houver data
 * de exame configurada, ou se a próxima revisão já ultrapassar essa data.
 */
export async function buildMaintenanceSchedule(
  r7CompletedAt: string,
  teaExamDate: string | null,
  maxDailyReviews: number,
  getExistingCount: DailyCountFetcher,
  startReviewNumber: number = REVIEW_PLAN[REVIEW_PLAN.length - 1].reviewNumber + 1
): Promise<ScheduledReview[]> {
  if (!teaExamDate) return []

  const batchCounts = new Map<string, number>()
  const countForDate: DailyCountFetcher = async (date) => {
    const existing = await getExistingCount(date)
    return existing + (batchCounts.get(date) ?? 0)
  }

  const scheduled: ScheduledReview[] = []
  let reviewNumber = startReviewNumber
  let candidateBase = r7CompletedAt

  while (true) {
    candidateBase = addDays(candidateBase, MAINTENANCE_INTERVAL_DAYS)
    if (candidateBase > teaExamDate) break

    const finalDate = await findAvailableDate(candidateBase, maxDailyReviews, countForDate)
    batchCounts.set(finalDate, (batchCounts.get(finalDate) ?? 0) + 1)

    scheduled.push({
      reviewNumber,
      scheduledDate: finalDate,
      taskType: MAINTENANCE_TASK_TYPE,
      suggestedQuestions: MAINTENANCE_SUGGESTED_QUESTIONS,
    })
    reviewNumber++
  }

  return scheduled
}
