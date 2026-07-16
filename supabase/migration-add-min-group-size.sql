-- ============================================================
-- competition_award_settings에 min_group_size 컬럼 추가
--
-- 용도: per_major_category 시상(예: 월드MVP챔피언)에서
--       특정 대종목의 참가 인원이 기준 미만이면 시상 제외.
--
-- 예시: 월드MVP챔피언 min_group_size = 5
--   → 대종목 내 채점된 선수 5명 미만이면 월드MVP챔피언 미시상
--   → 그 선수들은 다음 순위 시상(월드마스터 등)으로 자동 배분
--
-- 실행 후: 시상 설정 패널 → 월드MVP챔피언 → "최소 N명↑만" 필드 입력
-- ============================================================

ALTER TABLE competition_award_settings
  ADD COLUMN IF NOT EXISTS min_group_size int DEFAULT NULL;

COMMENT ON COLUMN competition_award_settings.min_group_size IS
  '대종목별 시상 최소 참가 인원. NULL이면 제한 없음. per_major_category=true일 때만 적용.';

-- 검증
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'competition_award_settings'
  AND column_name = 'min_group_size';
