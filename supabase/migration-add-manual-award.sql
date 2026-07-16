-- contestants 테이블에 수동 시상 오버라이드 컬럼 추가
-- 설정 시: 점수 집계 결과와 무관하게 이 값이 시상으로 우선 사용됨
ALTER TABLE contestants ADD COLUMN IF NOT EXISTS manual_award text DEFAULT NULL;

-- 검증
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'contestants' AND column_name = 'manual_award';
