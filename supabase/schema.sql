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
  provider   text,                      -- 'google' | 'kakao' | 'naver' | 'credentials'
  role       text not null default 'user'
             check (role in ('user', 'admin')),
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
