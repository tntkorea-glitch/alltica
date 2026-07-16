-- ============================================================
-- 대회 전체 시상 설정 테이블
-- Supabase SQL Editor에서 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS public.competition_award_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  grade text,                         -- null=전체, '프로전문가부', '학생부'
  award_name text NOT NULL,
  count integer,                      -- 고정 인원수 (percent와 둘 중 하나)
  percent numeric,                    -- 비율 (예: 10 = 10%)
  per_major_category boolean NOT NULL DEFAULT false, -- 대종목별 1명
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS competition_award_settings_competition_id_idx
  ON public.competition_award_settings (competition_id);
