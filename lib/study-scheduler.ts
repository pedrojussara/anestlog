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

export const DIFFICULTY_LABELS: Record<DifficultyRating, string> = {
  dificil: 'Difícil',
  medio: 'Médio',
  facil: 'Fácil',
}

export const DEFAULT_DIFFICULTY: DifficultyRating = 'medio'
export const MIN_SAMPLE_SIZE = 10

interface FlashcardsByDifficulty {
  dificil: number
  medio: number
  facil: number
}

export interface ReviewPlanItem {
  reviewNumber: number
  intervalDays: number // dias após studied_at
  taskType: ReviewTaskType
  suggestedQuestions: number | null
  // R1: quantidade fixa de flashcards, independente da faixa (ainda não há aferição)
  fixedFlashcards: number | null
  // R3, R5: quantidade de flashcards inversamente proporcional ao acerto —
  // quem foi mal precisa reconstruir a base
  flashcardsByDifficulty: FlashcardsByDifficulty | null
  // true apenas para revisões de questões PURAS (R2, R4, R6): são elas que
  // aferem/reaferem a faixa de dificuldade vigente do tema
  assessesPerformance: boolean
}

// R1–R7: intervalos fixos a partir da data de estudo. R2/R4/R6 são questões
// puras que aferem a faixa; R1/R3/R5 combinam flashcards (quantidade fixa em
// R1, dependente da faixa em R3/R5); R7 é o simulado final.
export const REVIEW_PLAN: ReviewPlanItem[] = [
  { reviewNumber: 1, intervalDays: 1,   taskType: 'flashcards',           suggestedQuestions: null, fixedFlashcards: 20,   flashcardsByDifficulty: null,                                assessesPerformance: false },
  { reviewNumber: 2, intervalDays: 3,   taskType: 'questoes',             suggestedQuestions: 15,   fixedFlashcards: null, flashcardsByDifficulty: null,                                assessesPerformance: true  },
  { reviewNumber: 3, intervalDays: 7,   taskType: 'flashcards_questoes',  suggestedQuestions: 20,   fixedFlashcards: null, flashcardsByDifficulty: { dificil: 25, medio: 15, facil: 8 }, assessesPerformance: false },
  { reviewNumber: 4, intervalDays: 15,  taskType: 'questoes',             suggestedQuestions: 20,   fixedFlashcards: null, flashcardsByDifficulty: null,                                assessesPerformance: true  },
  { reviewNumber: 5, intervalDays: 30,  taskType: 'flashcards_questoes',  suggestedQuestions: 25,   fixedFlashcards: null, flashcardsByDifficulty: { dificil: 20, medio: 12, facil: 6 }, assessesPerformance: false },
  { reviewNumber: 6, intervalDays: 60,  taskType: 'questoes',             suggestedQuestions: 25,   fixedFlashcards: null, flashcardsByDifficulty: null,                                assessesPerformance: true  },
  { reviewNumber: 7, intervalDays: 120, taskType: 'simulado',             suggestedQuestions: 30,   fixedFlashcards: null, flashcardsByDifficulty: null,                                assessesPerformance: false },
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
  suggestedFlashcards: number | null
}

/** Retorna a contagem de revisões já agendadas para o usuário numa data. */
export type DailyCountFetcher = (date: string) => Promise<number>

// ---- Helpers de data (strings YYYY-MM-DD, sem fuso horário) ----

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function diffDays(fromISO: string, toISO: string): number {
  const [ay, am, ad] = fromISO.split('-').map(Number)
  const [by, bm, bd] = toISO.split('-').map(Number)
  const a = Date.UTC(ay, am - 1, ad)
  const b = Date.UTC(by, bm - 1, bd)
  return Math.round((b - a) / 86400000)
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

/** Quantidade de flashcards sugerida para uma revisão, dada a faixa vigente.
 *  Retorna null para revisões sem componente de flashcards (R2, R4, R6, R7). */
export function suggestedFlashcardsFor(reviewNumber: number, difficulty: DifficultyRating): number | null {
  const item = REVIEW_PLAN.find((r) => r.reviewNumber === reviewNumber)
  if (!item) return null
  if (item.fixedFlashcards != null) return item.fixedFlashcards
  if (item.flashcardsByDifficulty) return item.flashcardsByDifficulty[difficulty]
  return null
}

/** true apenas para R2/R4/R6 — as únicas revisões que aferem/reaferem a faixa. */
export function reviewAssessesPerformance(reviewNumber: number): boolean {
  return REVIEW_PLAN.find((r) => r.reviewNumber === reviewNumber)?.assessesPerformance ?? false
}

export interface DifficultyOutcome {
  difficulty: DifficultyRating
  percentage: number
  lowSample: boolean
}

/**
 * Calcula a faixa de dificuldade a partir do percentual de acerto:
 * < 70% dificil, 70–90% medio, > 90% facil. Exige uma amostra mínima de
 * MIN_SAMPLE_SIZE questões — abaixo disso, mantém a faixa anterior e sinaliza
 * lowSample para o chamador avisar o usuário.
 */
export function computeDifficultyFromScore(
  questionsCorrect: number,
  questionsTotal: number,
  previousDifficulty: DifficultyRating
): DifficultyOutcome {
  const percentage = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0

  if (questionsTotal < MIN_SAMPLE_SIZE) {
    return { difficulty: previousDifficulty, percentage, lowSample: true }
  }

  const difficulty: DifficultyRating = percentage < 70 ? 'dificil' : percentage > 90 ? 'facil' : 'medio'
  return { difficulty, percentage, lowSample: false }
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
 * usuário já tem agendadas (de qualquer sessão) numa data. Antes da primeira
 * aferição (R2), a faixa é tratada como 'medio' para fins de flashcards.
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
      suggestedFlashcards: suggestedFlashcardsFor(item.reviewNumber, DEFAULT_DIFFICULTY),
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
  suggestedFlashcards: number | null
}

/**
 * Reagenda as revisões futuras pendentes de uma sessão após a conclusão de
 * uma delas, escalando os intervalos originais pelo multiplicador da faixa de
 * dificuldade vigente (dificil: ×0.6, medio: ×1, facil: ×1.5) e recalculando
 * a quantidade de flashcards sugerida (R3/R5) para essa faixa. Encadeia a
 * partir da data de conclusão e respeita o teto diário do usuário.
 */
export async function rescheduleFutureReviews(
  completedReviewNumber: number,
  completedAt: string,
  difficulty: DifficultyRating,
  pendingReviews: PendingReview[],
  maxDailyReviews: number,
  getExistingCount: DailyCountFetcher
): Promise<RescheduledReview[]> {
  const multiplier = difficultyMultiplier(difficulty)
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

    results.push({
      id: review.id,
      scheduledDate: finalDate,
      suggestedFlashcards: suggestedFlashcardsFor(review.reviewNumber, difficulty),
    })

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
      suggestedFlashcards: null,
    })
    reviewNumber++
  }

  return scheduled
}
