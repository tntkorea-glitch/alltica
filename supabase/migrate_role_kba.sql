-- Migration: KBA 역할 추가
-- Supabase SQL Editor에서 실행하세요.

-- 1. 기존 role CHECK 제약 삭제 (이름이 다를 수 있으므로 IF EXISTS 사용)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. 새 제약 추가 (subadmin + KBA 역할 포함)
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'instructor', 'subadmin', 'admin', 'KBA이사', 'KBA지회장', 'KBA지부장', 'KBA정회원'));
