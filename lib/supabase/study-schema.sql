-- ============================================================
-- AnestLog — Módulo de Estudos (TEA/TSA) — Schema SQL
-- Execute este arquivo no SQL Editor do Supabase
-- Depende de lib/supabase/schema.sql (tabela public.users)
-- ============================================================

-- ============================================================
-- 1. ÁREAS VÁLIDAS (usadas em vários checks abaixo)
-- ============================================================
-- Farmacologia, Fisiologia, Anestesia Regional, Via Aérea,
-- Anestesia Cardiovascular, Neuroanestesia, Obstetrícia, Pediatria,
-- Dor, Terapia Intensiva, Equipamentos e Monitorização,
-- Anestesia Ambulatorial, Complicações, Ética e Legislação

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- 2.1 study_topics
-- Catálogo de temas do edital. Temas do catálogo (is_custom = false) são
-- compartilhados/visíveis para todos os usuários autenticados. Temas
-- personalizados (is_custom = true) pertencem a quem os criou.
create table if not exists public.study_topics (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  area       text not null check (area in (
    'Farmacologia', 'Fisiologia', 'Anestesia Regional', 'Via Aérea',
    'Anestesia Cardiovascular', 'Neuroanestesia', 'Obstetrícia', 'Pediatria',
    'Dor', 'Terapia Intensiva', 'Equipamentos e Monitorização',
    'Anestesia Ambulatorial', 'Complicações', 'Ética e Legislação'
  )),
  is_custom  boolean not null default false,
  created_by uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint study_topics_custom_requires_creator
    check (is_custom = false or created_by is not null)
);

-- 2.2 study_sessions
create table if not exists public.study_sessions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  topic_id   uuid not null references public.study_topics(id),
  studied_at date not null,
  notes      text,
  source     text,
  created_at timestamptz not null default now()
);

-- 2.3 review_tasks
create table if not exists public.review_tasks (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.users(id) on delete cascade,
  session_id           uuid not null references public.study_sessions(id) on delete cascade,
  topic_id             uuid not null references public.study_topics(id),
  scheduled_date       date not null,
  review_number        integer not null check (review_number >= 1),
  task_type            text not null check (task_type in (
    'flashcards', 'questoes', 'flashcards_questoes', 'simulado', 'revisao_resumo'
  )),
  suggested_questions  integer,
  status               text not null default 'pending' check (status in (
    'pending', 'completed', 'skipped'
  )),
  difficulty_rating    text check (difficulty_rating in ('dificil', 'medio', 'facil')),
  completed_at         timestamptz,
  created_at           timestamptz not null default now()
);

-- 2.4 study_settings
create table if not exists public.study_settings (
  user_id           uuid primary key references public.users(id) on delete cascade,
  max_daily_reviews integer not null default 3,
  tea_exam_date     date,
  tsa_exam_date     date
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================
create index if not exists study_topics_area_idx        on public.study_topics(area);
create index if not exists study_topics_created_by_idx   on public.study_topics(created_by);

-- Evita temas duplicados no catálogo compartilhado e permite reexecutar o seed com segurança
create unique index if not exists study_topics_catalog_name_unique
  on public.study_topics(name) where is_custom = false;

create index if not exists study_sessions_user_id_idx    on public.study_sessions(user_id);
create index if not exists study_sessions_topic_id_idx   on public.study_sessions(topic_id);
create index if not exists study_sessions_studied_at_idx on public.study_sessions(studied_at);

create index if not exists review_tasks_user_id_idx           on public.review_tasks(user_id);
create index if not exists review_tasks_session_id_idx        on public.review_tasks(session_id);
create index if not exists review_tasks_topic_id_idx          on public.review_tasks(topic_id);
create index if not exists review_tasks_status_idx            on public.review_tasks(status);
create index if not exists review_tasks_user_date_idx         on public.review_tasks(user_id, scheduled_date);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.study_topics   enable row level security;
alter table public.study_sessions enable row level security;
alter table public.review_tasks   enable row level security;
alter table public.study_settings enable row level security;

-- ---- study_topics ----
-- Catálogo (is_custom = false) é visível para todos os autenticados;
-- temas personalizados só são visíveis para quem os criou.

create policy "Usuário vê catálogo e seus temas personalizados"
  on public.study_topics for select
  using (is_custom = false or created_by = auth.uid());

create policy "Usuário cria apenas temas personalizados próprios"
  on public.study_topics for insert
  with check (is_custom = true and created_by = auth.uid());

create policy "Usuário atualiza seus próprios temas personalizados"
  on public.study_topics for update
  using (is_custom = true and created_by = auth.uid());

create policy "Usuário deleta seus próprios temas personalizados"
  on public.study_topics for delete
  using (is_custom = true and created_by = auth.uid());

-- ---- study_sessions ----

create policy "Usuário vê suas próprias sessões de estudo"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas próprias sessões de estudo"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas próprias sessões de estudo"
  on public.study_sessions for update
  using (auth.uid() = user_id);

create policy "Usuário deleta suas próprias sessões de estudo"
  on public.study_sessions for delete
  using (auth.uid() = user_id);

-- ---- review_tasks ----

create policy "Usuário vê suas próprias revisões"
  on public.review_tasks for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas próprias revisões"
  on public.review_tasks for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas próprias revisões"
  on public.review_tasks for update
  using (auth.uid() = user_id);

create policy "Usuário deleta suas próprias revisões"
  on public.review_tasks for delete
  using (auth.uid() = user_id);

-- ---- study_settings ----

create policy "Usuário vê suas próprias configurações de estudo"
  on public.study_settings for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas próprias configurações de estudo"
  on public.study_settings for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas próprias configurações de estudo"
  on public.study_settings for update
  using (auth.uid() = user_id);

create policy "Usuário deleta suas próprias configurações de estudo"
  on public.study_settings for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 5. SEED — Catálogo de temas do programa de anestesiologia (TEA)
-- ============================================================

insert into public.study_topics (name, area, is_custom) values
-- Farmacologia
('Farmacocinética e farmacodinâmica dos anestésicos venosos', 'Farmacologia', false),
('Hipnóticos: propofol, etomidato, cetamina', 'Farmacologia', false),
('Opioides: farmacologia e efeitos adversos', 'Farmacologia', false),
('Bloqueadores neuromusculares despolarizantes e adespolarizantes', 'Farmacologia', false),
('Reversão do bloqueio neuromuscular (neostigmina, sugammadex)', 'Farmacologia', false),
('Anestésicos locais: farmacologia e toxicidade sistêmica (LAST)', 'Farmacologia', false),
('Anestésicos inalatórios: MAC, captação e distribuição', 'Farmacologia', false),
('Interações medicamentosas em anestesia', 'Farmacologia', false),

-- Fisiologia
('Fisiologia respiratória aplicada à anestesia', 'Fisiologia', false),
('Fisiologia cardiovascular e determinantes do débito cardíaco', 'Fisiologia', false),
('Fisiologia renal e função tubular', 'Fisiologia', false),
('Fisiologia hepática e metabolismo de fármacos', 'Fisiologia', false),
('Equilíbrio ácido-básico e distúrbios eletrolíticos', 'Fisiologia', false),
('Fisiologia do sistema nervoso autônomo', 'Fisiologia', false),
('Termorregulação e hipotermia perioperatória', 'Fisiologia', false),

-- Anestesia Regional
('Anatomia do neuroeixo e técnica de raquianestesia', 'Anestesia Regional', false),
('Anestesia peridural: técnica e complicações', 'Anestesia Regional', false),
('Bloqueio de plexo braquial (interescalênico, supra e infraclavicular, axilar)', 'Anestesia Regional', false),
('Bloqueios de membro inferior (femoral, ciático, poplíteo)', 'Anestesia Regional', false),
('Bloqueios de tronco (TAP block, paravertebral, quadrado lombar)', 'Anestesia Regional', false),
('Anestesia regional guiada por ultrassom', 'Anestesia Regional', false),
('Complicações da anestesia regional (bloqueio espinhal total, síndrome da cauda equina)', 'Anestesia Regional', false),

-- Via Aérea
('Avaliação da via aérea difícil', 'Via Aérea', false),
('Algoritmo de via aérea difícil (SBA/ASA)', 'Via Aérea', false),
('Dispositivos supraglóticos', 'Via Aérea', false),
('Intubação com fibroscópio flexível', 'Via Aérea', false),
('Via aérea cirúrgica de emergência (cricotireoidostomia)', 'Via Aérea', false),
('Extubação da via aérea difícil', 'Via Aérea', false),

-- Anestesia Cardiovascular
('Anestesia para cirurgia cardíaca com circulação extracorpórea', 'Anestesia Cardiovascular', false),
('Monitorização hemodinâmica invasiva', 'Anestesia Cardiovascular', false),
('Manejo do paciente coronariopata em cirurgia não cardíaca', 'Anestesia Cardiovascular', false),
('Anestesia para cirurgia vascular (aneurisma de aorta, endarterectomia)', 'Anestesia Cardiovascular', false),
('Ecocardiografia transesofágica intraoperatória', 'Anestesia Cardiovascular', false),
('Suporte inotrópico e vasopressor', 'Anestesia Cardiovascular', false),
('Marcapasso e CDI no perioperatório', 'Anestesia Cardiovascular', false),

-- Neuroanestesia
('Pressão intracraniana e fluxo sanguíneo cerebral', 'Neuroanestesia', false),
('Anestesia para craniotomia', 'Neuroanestesia', false),
('Neuromonitorização intraoperatória (EEG, potenciais evocados)', 'Neuroanestesia', false),
('Anestesia para cirurgia de coluna', 'Neuroanestesia', false),
('Manejo do traumatismo cranioencefálico', 'Neuroanestesia', false),
('Anestesia para neurocirurgia funcional (paciente acordado)', 'Neuroanestesia', false),

-- Obstetrícia
('Alterações fisiológicas da gestação', 'Obstetrícia', false),
('Analgesia de parto', 'Obstetrícia', false),
('Anestesia para cesariana', 'Obstetrícia', false),
('Pré-eclâmpsia e síndrome HELLP', 'Obstetrícia', false),
('Hemorragia obstétrica', 'Obstetrícia', false),
('Reanimação neonatal', 'Obstetrícia', false),

-- Pediatria
('Particularidades farmacológicas em pediatria', 'Pediatria', false),
('Via aérea pediátrica', 'Pediatria', false),
('Anestesia para o neonato e o prematuro', 'Pediatria', false),
('Jejum perioperatório em pediatria', 'Pediatria', false),
('Anestesia para cirurgia pediátrica ambulatorial', 'Pediatria', false),
('Manejo da dor em pediatria', 'Pediatria', false),

-- Dor
('Fisiopatologia da dor aguda e crônica', 'Dor', false),
('Escalas de avaliação da dor', 'Dor', false),
('Analgesia multimodal', 'Dor', false),
('Analgesia controlada pelo paciente (PCA)', 'Dor', false),
('Dor crônica pós-cirúrgica', 'Dor', false),
('Bloqueios para tratamento de dor crônica', 'Dor', false),

-- Terapia Intensiva
('Ventilação mecânica: modos e estratégias protetoras', 'Terapia Intensiva', false),
('Sepse e choque séptico', 'Terapia Intensiva', false),
('Síndrome do desconforto respiratório agudo (SDRA)', 'Terapia Intensiva', false),
('Suporte nutricional do paciente crítico', 'Terapia Intensiva', false),
('Sedação e analgesia em UTI', 'Terapia Intensiva', false),
('Insuficiência renal aguda e terapia de substituição renal', 'Terapia Intensiva', false),

-- Equipamentos e Monitorização
('Máquina de anestesia: circuito e componentes', 'Equipamentos e Monitorização', false),
('Monitorização da profundidade anestésica (BIS, entropia)', 'Equipamentos e Monitorização', false),
('Capnografia e oximetria de pulso', 'Equipamentos e Monitorização', false),
('Monitorização neuromuscular (TOF)', 'Equipamentos e Monitorização', false),
('Sistemas de absorção de CO2 e cal sodada', 'Equipamentos e Monitorização', false),
('Segurança em anestesia e checagem pré-uso do aparelho', 'Equipamentos e Monitorização', false),

-- Anestesia Ambulatorial
('Critérios de seleção de pacientes para cirurgia ambulatorial', 'Anestesia Ambulatorial', false),
('Técnicas anestésicas para recuperação rápida', 'Anestesia Ambulatorial', false),
('Náusea e vômito pós-operatórios (PONV)', 'Anestesia Ambulatorial', false),
('Critérios de alta pós-anestésica', 'Anestesia Ambulatorial', false),
('Fast-track em anestesia', 'Anestesia Ambulatorial', false),

-- Complicações
('Hipertermia maligna', 'Complicações', false),
('Anafilaxia perioperatória', 'Complicações', false),
('Aspiração pulmonar de conteúdo gástrico', 'Complicações', false),
('Parada cardiorrespiratória perioperatória', 'Complicações', false),
('Despertar intraoperatório (consciência intraoperatória)', 'Complicações', false),
('Lesões posicionais e neuropatias periféricas', 'Complicações', false),

-- Ética e Legislação
('Consentimento informado em anestesia', 'Ética e Legislação', false),
('Ética no fim de vida e ordens de não reanimação', 'Ética e Legislação', false),
('Responsabilidade civil e ética médica', 'Ética e Legislação', false),
('Legislação do CFM sobre anestesiologia', 'Ética e Legislação', false),
('Testemunhas de Jeová e recusa de hemotransfusão', 'Ética e Legislação', false)

on conflict (name) where is_custom = false do nothing;
