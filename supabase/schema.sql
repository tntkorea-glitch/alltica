-- alltica Supabase schema
-- Run this once in Supabase SQL Editor after creating the alltica project.

-- ============================================================
-- applications table
-- 세미나 신청 데이터 저장
-- ============================================================
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),

  -- 신청 대상 세미나
  seminar_slug    text not null,
  seminar_title   text not null,
  seminar_price   integer,                -- 원 단위 (신청 시점 스냅샷)

  -- 신청자 정보 (명함 OCR 또는 수동 입력)
  name            text not null,
  company         text,
  position        text,
  phone           text not null,
  email           text,
  address         text,

  -- 추가 옵션 (세미나 폼에서 받는 것들)
  attendees       integer default 1,
  requests        text,

  -- 명함 이미지 + OCR 메타
  business_card_url text,                 -- Supabase Storage public URL
  ocr_raw         jsonb,                  -- Claude Vision 원본 응답 (감사용)

  -- 상태 관리
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'cancelled')),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid', 'paid', 'refunded')),
  notes           text,                   -- 관리자 메모

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists applications_seminar_slug_idx
  on public.applications (seminar_slug);
create index if not exists applications_created_at_idx
  on public.applications (created_at desc);
create index if not exists applications_phone_idx
  on public.applications (phone);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS: 서버 측(service_role key)에서만 접근. 브라우저 직접 접근 차단.
-- ============================================================
alter table public.applications enable row level security;

-- 기본적으로 어떤 정책도 추가하지 않음 → anon/authenticated 모두 접근 불가
-- service_role은 RLS 우회하므로 API 라우트에서만 조작 가능

-- ============================================================
-- app_settings table (테마 등 사이트 전역 설정)
-- ============================================================
create table if not exists public.app_settings (
  key   text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('theme', 'navy')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;
-- anon/authenticated 읽기만 허용 (쓰기는 service_role 로만)
drop policy if exists "app_settings read" on public.app_settings;
create policy "app_settings read" on public.app_settings
  for select to anon, authenticated using (true);

-- ============================================================
-- Storage bucket: 명함 이미지
-- ============================================================
-- Supabase Dashboard > Storage > New bucket 에서 수동 생성:
--   name: business-cards
--   public: off (서명 URL 발급 방식)
--
-- 또는 SQL로 생성:
insert into storage.buckets (id, name, public)
values ('business-cards', 'business-cards', false)
on conflict (id) do nothing;

-- Storage RLS: service_role만 쓰기, 읽기는 서명 URL로만 접근 가능
-- (기본값이 이미 이렇게 동작하므로 별도 policy 불필요)

-- ============================================================
-- users table (NextAuth v5 JWT 세션 + 영속 사용자 레코드)
-- Google/Kakao/Naver 로그인 시 자동 생성.
-- ============================================================
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  image      text,
  phone      text,                      -- 강사용 — 세미나 SMS 발신번호로도 활용
  provider   text,                      -- 'google' | 'kakao' | 'naver' | 'credentials'
  role       text not null default 'user'
             check (role in ('user', 'instructor', 'admin')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
-- service_role 에서만 조작 (브라우저 직접 접근 차단)

-- ============================================================
-- seminars table (강사가 직접 등록하는 세미나)
-- ============================================================
create table if not exists public.seminars (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique,
  title                    text not null,
  subtitle                 text,
  date_display             text not null,
  start_at                 timestamptz not null,
  end_at                   timestamptz,
  location                 text not null,
  instructor_name          text not null,  -- 표시용 (예: "노태영 대표")
  instructor_id            uuid references public.users(id) on delete set null,
  instructor_sender_phone  text,           -- 이 세미나의 SolAPI 발신번호 (solapi에 사전등록된 번호)
  instructor_notify_phones text,           -- 관리자 알림 수신번호 (쉼표 구분) — 강사 본인 번호 등
  price                    integer not null default 0,
  capacity                 integer,
  summary                  text,
  description              text,
  curriculum               jsonb,          -- string[]
  target                   jsonb,          -- string[]
  tags                     jsonb,          -- string[]
  status                   text not null default 'upcoming'
                           check (status in ('upcoming', 'open', 'closed', 'completed')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists seminars_status_idx on public.seminars (status);
create index if not exists seminars_start_at_idx on public.seminars (start_at);
create index if not exists seminars_instructor_id_idx on public.seminars (instructor_id);

drop trigger if exists seminars_set_updated_at on public.seminars;
create trigger seminars_set_updated_at
  before update on public.seminars
  for each row execute function public.set_updated_at();

alter table public.seminars enable row level security;
-- 읽기: 누구나 (세미나 공개 페이지용)
drop policy if exists "seminars read" on public.seminars;
create policy "seminars read" on public.seminars
  for select to anon, authenticated using (true);
-- 쓰기는 service_role 에서만 (API 라우트 통해 강사 권한 검증 후 조작)

-- ============================================================
-- submissions table (일반 문의/제품/인재/파트너 폼 등 — 세미나 외 전체)
-- 이전에는 data/submissions.json + public/uploads/ 파일 기반이었으나
-- Vercel 서버리스에서 영속 저장이 안 되어 Supabase 로 이관.
-- ============================================================
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  form_slug     text not null,
  form_title    text not null,
  data          jsonb not null default '{}'::jsonb,
  files         jsonb not null default '{}'::jsonb,  -- { fieldName: storagePath }
  submitted_at  timestamptz not null default now()
);

create index if not exists submissions_form_slug_idx
  on public.submissions (form_slug);
create index if not exists submissions_submitted_at_idx
  on public.submissions (submitted_at desc);

alter table public.submissions enable row level security;
-- 정책 없음 → service_role 만 접근 (API 라우트에서 admin 검증 후 조회)

-- ============================================================
-- Storage bucket: 일반 문의 폼에 첨부된 파일
-- ============================================================
insert into storage.buckets (id, name, public)
values ('submission-files', 'submission-files', false)
on conflict (id) do nothing;
