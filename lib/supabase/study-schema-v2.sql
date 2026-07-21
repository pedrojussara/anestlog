-- ============================================================
-- AnestLog — Módulo de Estudos — Desempenho real (dificuldade por % de acerto)
-- Execute no SQL Editor do Supabase, após lib/supabase/study-schema.sql
-- ============================================================

-- review_tasks: registro do resultado objetivo de questões e da quantidade
-- de flashcards sugerida (varia conforme a faixa de dificuldade vigente)
alter table public.review_tasks
  add column if not exists questions_correct integer,
  add column if not exists questions_total integer,
  add column if not exists suggested_flashcards integer;

alter table public.review_tasks
  add constraint review_tasks_questions_correct_check
  check (questions_correct is null or questions_correct >= 0);

alter table public.review_tasks
  add constraint review_tasks_questions_total_check
  check (questions_total is null or questions_total >= 1);

alter table public.review_tasks
  add constraint review_tasks_questions_correct_le_total_check
  check (questions_correct is null or questions_total is null or questions_correct <= questions_total);

-- study_sessions: faixa de dificuldade vigente do tema, recalculada a cada
-- revisão de questões concluída (dificil / medio / facil)
alter table public.study_sessions
  add column if not exists current_difficulty text;

alter table public.study_sessions
  add constraint study_sessions_current_difficulty_check
  check (current_difficulty in ('dificil', 'medio', 'facil'));
