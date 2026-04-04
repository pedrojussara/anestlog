-- ============================================================
-- AnestLog — Schema SQL
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- 2.1 users
-- Espelha auth.users e armazena dados do perfil do residente
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  institution   text,
  city          text,
  residency_year smallint check (residency_year between 1 and 5),
  is_public     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- 2.2 surgeries
create table if not exists public.surgeries (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  date             date not null,
  specialty        text not null,
  anesthesia_types text[] not null default '{}',  -- array: múltiplos tipos possíveis
  notes            text,
  created_at       timestamptz not null default now()
);

-- 2.3 procedures
create table if not exists public.procedures (
  id                 uuid primary key default uuid_generate_v4(),
  surgery_id         uuid not null references public.surgeries(id) on delete cascade,
  type               text not null,
  status             text not null check (status in ('success', 'failure')),
  is_difficult_airway boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now()
);

-- 2.4 nerve_blocks
create table if not exists public.nerve_blocks (
  id                 uuid primary key default uuid_generate_v4(),
  procedure_id       uuid not null references public.procedures(id) on delete cascade,
  block_type         text not null,
  postop_pain_level  smallint check (postop_pain_level between 0 and 10),
  created_at         timestamptz not null default now()
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================
create index if not exists surgeries_user_id_idx   on public.surgeries(user_id);
create index if not exists surgeries_date_idx       on public.surgeries(date);
create index if not exists procedures_surgery_id_idx on public.procedures(surgery_id);
create index if not exists nerve_blocks_procedure_id_idx on public.nerve_blocks(procedure_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users        enable row level security;
alter table public.surgeries    enable row level security;
alter table public.procedures   enable row level security;
alter table public.nerve_blocks enable row level security;

-- ---- users ----

-- Qualquer pessoa autenticada pode ver perfis públicos
create policy "Perfis públicos visíveis por todos"
  on public.users for select
  using (is_public = true or auth.uid() = id);

-- Apenas o próprio usuário pode inserir/atualizar/deletar seu perfil
create policy "Usuário gerencia seu próprio perfil"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Usuário atualiza seu próprio perfil"
  on public.users for update
  using (auth.uid() = id);

create policy "Usuário deleta seu próprio perfil"
  on public.users for delete
  using (auth.uid() = id);

-- ---- surgeries ----

create policy "Usuário vê suas próprias cirurgias"
  on public.surgeries for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas próprias cirurgias"
  on public.surgeries for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas próprias cirurgias"
  on public.surgeries for update
  using (auth.uid() = user_id);

create policy "Usuário deleta suas próprias cirurgias"
  on public.surgeries for delete
  using (auth.uid() = user_id);

-- ---- procedures ----
-- Acesso via join com surgeries (checa user_id indiretamente)

create policy "Usuário vê procedimentos de suas cirurgias"
  on public.procedures for select
  using (
    exists (
      select 1 from public.surgeries s
      where s.id = surgery_id and s.user_id = auth.uid()
    )
  );

create policy "Usuário insere procedimentos em suas cirurgias"
  on public.procedures for insert
  with check (
    exists (
      select 1 from public.surgeries s
      where s.id = surgery_id and s.user_id = auth.uid()
    )
  );

create policy "Usuário atualiza procedimentos de suas cirurgias"
  on public.procedures for update
  using (
    exists (
      select 1 from public.surgeries s
      where s.id = surgery_id and s.user_id = auth.uid()
    )
  );

create policy "Usuário deleta procedimentos de suas cirurgias"
  on public.procedures for delete
  using (
    exists (
      select 1 from public.surgeries s
      where s.id = surgery_id and s.user_id = auth.uid()
    )
  );

-- ---- nerve_blocks ----
-- Acesso via join com procedures → surgeries

create policy "Usuário vê bloqueios de seus procedimentos"
  on public.nerve_blocks for select
  using (
    exists (
      select 1
      from public.procedures p
      join public.surgeries s on s.id = p.surgery_id
      where p.id = procedure_id and s.user_id = auth.uid()
    )
  );

create policy "Usuário insere bloqueios em seus procedimentos"
  on public.nerve_blocks for insert
  with check (
    exists (
      select 1
      from public.procedures p
      join public.surgeries s on s.id = p.surgery_id
      where p.id = procedure_id and s.user_id = auth.uid()
    )
  );

create policy "Usuário atualiza bloqueios de seus procedimentos"
  on public.nerve_blocks for update
  using (
    exists (
      select 1
      from public.procedures p
      join public.surgeries s on s.id = p.surgery_id
      where p.id = procedure_id and s.user_id = auth.uid()
    )
  );

create policy "Usuário deleta bloqueios de seus procedimentos"
  on public.nerve_blocks for delete
  using (
    exists (
      select 1
      from public.procedures p
      join public.surgeries s on s.id = p.surgery_id
      where p.id = procedure_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. TRIGGER — cria perfil automaticamente após signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
