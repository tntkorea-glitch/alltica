-- ============================================================
-- Judge System 누락 컬럼 추가
-- judge-schema.sql 최초 실행 후 이 파일 실행
-- Supabase SQL Editor에서 실행
-- ============================================================

-- contestants: 단체명, 부문(급수), 참가번호
ALTER TABLE public.contestants
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS grade   text,
  ADD COLUMN IF NOT EXISTS number  integer;

-- contestant_files: YouTube URL 저장 + storage_path nullable 허용
ALTER TABLE public.contestant_files
  ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.contestant_files
  ALTER COLUMN storage_path DROP NOT NULL;

-- competitions: 신청서 연동용 슬러그
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS contest_slug text;

-- categories: 대종목 그룹핑
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS major_category text;

-- judge_assignments: 심사위원 직책
ALTER TABLE public.judge_assignments
  ADD COLUMN IF NOT EXISTS title text;
