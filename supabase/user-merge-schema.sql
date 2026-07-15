-- ============================================================
-- 계정 병합 스키마
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ── 연결 이메일 테이블 ──────────────────────────────────────
-- 병합 시 삭제된 계정의 이메일을 여기 저장 → 재로그인해도 primary로 연결
create table if not exists public.user_linked_accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  email      text not null unique,
  provider   text,
  linked_at  timestamptz not null default now()
);

create index if not exists user_linked_accounts_user_id_idx
  on public.user_linked_accounts (user_id);

alter table public.user_linked_accounts enable row level security;
-- service_role 에서만 접근

-- ── 병합 함수 ───────────────────────────────────────────────
-- 단일 트랜잭션으로 보조 계정들을 primary 로 병합
create or replace function public.merge_users(
  p_primary_id    uuid,
  p_secondary_ids uuid[]
)
returns jsonb
language plpgsql
security definer
as $$
declare
  sec_id    uuid;
  sec_email text;
  sec_provider text;
  sec_phone text;
  pri_phone text;
  merged_count int := 0;
begin
  -- primary 존재 확인 + 잠금
  if not exists (select 1 from public.users where id = p_primary_id for update) then
    raise exception 'Primary user not found: %', p_primary_id;
  end if;

  select phone into pri_phone from public.users where id = p_primary_id;

  foreach sec_id in array p_secondary_ids
  loop
    -- secondary 존재 확인 + 잠금
    select email, provider, phone
      into sec_email, sec_provider, sec_phone
      from public.users
     where id = sec_id
       for update;

    if not found then
      continue;
    end if;

    -- primary 연락처가 없으면 secondary 것을 채움
    if pri_phone is null and sec_phone is not null then
      update public.users set phone = sec_phone where id = p_primary_id;
      pri_phone := sec_phone;
    end if;

    -- 단순 재할당 (unique 충돌 없음)
    update public.seminars          set instructor_id = p_primary_id where instructor_id = sec_id;
    update public.contestants       set user_id       = p_primary_id where user_id       = sec_id;
    update public.contestant_files  set uploaded_by   = p_primary_id where uploaded_by   = sec_id;
    update public.judge_assignments set assigned_by   = p_primary_id where assigned_by   = sec_id;

    -- judge_assignments.user_id — UNIQUE(user_id, category_id)
    update public.judge_assignments ja
       set user_id = p_primary_id
     where ja.user_id = sec_id
       and not exists (
         select 1 from public.judge_assignments
          where user_id = p_primary_id and category_id = ja.category_id
       );
    delete from public.judge_assignments where user_id = sec_id;

    -- scores.judge_id — UNIQUE(judge_id, contestant_id, criterion_id)
    update public.scores s
       set judge_id = p_primary_id
     where s.judge_id = sec_id
       and not exists (
         select 1 from public.scores
          where judge_id    = p_primary_id
            and contestant_id = s.contestant_id
            and criterion_id  = s.criterion_id
       );
    delete from public.scores where judge_id = sec_id;

    -- judge_submissions.judge_id — UNIQUE(judge_id, category_id)
    update public.judge_submissions js
       set judge_id = p_primary_id
     where js.judge_id = sec_id
       and not exists (
         select 1 from public.judge_submissions
          where judge_id = p_primary_id and category_id = js.category_id
       );
    delete from public.judge_submissions where judge_id = sec_id;

    -- 삭제된 이메일을 linked_accounts에 보존 (재로그인 시 primary로 연결)
    insert into public.user_linked_accounts (user_id, email, provider)
    values (p_primary_id, sec_email, sec_provider)
    on conflict (email) do update
      set user_id = p_primary_id, linked_at = now();

    -- secondary 삭제
    delete from public.users where id = sec_id;

    merged_count := merged_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'merged', merged_count);
end;
$$;
