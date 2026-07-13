-- ============================================================
-- Judge System Schema
-- Supabase SQL Editor에서 실행
-- ============================================================

-- Storage bucket (contestant files)
insert into storage.buckets (id, name, public)
values ('contestant-files', 'contestant-files', true)
on conflict (id) do nothing;

create policy "Public read contestant files"
  on storage.objects for select
  using (bucket_id = 'contestant-files');

-- ============================================================
-- competitions — 대회
-- ============================================================
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date_display text,
  status text not null default 'open'
    check (status in ('open', 'scoring', 'closed')),
  allow_contestant_upload boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_competitions_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

-- ============================================================
-- categories — 종목
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_competition_id_idx
  on public.categories (competition_id);

-- ============================================================
-- contestants — 선수
-- ============================================================
create table if not exists public.contestants (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  user_id uuid references public.users(id) on delete set null,
  upload_enabled boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists contestants_category_id_idx
  on public.contestants (category_id);
create index if not exists contestants_user_id_idx
  on public.contestants (user_id);

-- ============================================================
-- contestant_files — 작품 파일
-- ============================================================
create table if not exists public.contestant_files (
  id uuid primary key default gen_random_uuid(),
  contestant_id uuid not null references public.contestants(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text not null,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contestant_files_contestant_id_idx
  on public.contestant_files (contestant_id);

-- ============================================================
-- scoring_criteria — 채점 항목
-- ============================================================
create table if not exists public.scoring_criteria (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  max_score integer not null default 100,
  display_order integer not null default 0
);

create index if not exists scoring_criteria_category_id_idx
  on public.scoring_criteria (category_id);

-- ============================================================
-- judge_assignments — 심사위원 배정
-- ============================================================
create table if not exists public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create index if not exists judge_assignments_user_id_idx
  on public.judge_assignments (user_id);
create index if not exists judge_assignments_category_id_idx
  on public.judge_assignments (category_id);

-- ============================================================
-- scores — 채점 결과 (심사위원 × 선수 × 항목)
-- ============================================================
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.users(id) on delete cascade,
  contestant_id uuid not null references public.contestants(id) on delete cascade,
  criterion_id uuid not null references public.scoring_criteria(id) on delete cascade,
  score integer not null check (score >= 0),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (judge_id, contestant_id, criterion_id)
);

create index if not exists scores_judge_id_idx on public.scores (judge_id);
create index if not exists scores_contestant_id_idx on public.scores (contestant_id);

create trigger set_scores_updated_at
  before update on public.scores
  for each row execute function public.set_updated_at();

-- ============================================================
-- judge_submissions — 채점 제출 완료 (잠금)
-- ============================================================
create table if not exists public.judge_submissions (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (judge_id, category_id)
);

-- ============================================================
-- award_settings — 시상 설정
-- ============================================================
create table if not exists public.award_settings (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  award_name text not null,
  count integer,
  display_order integer not null default 0
);

create index if not exists award_settings_category_id_idx
  on public.award_settings (category_id);
