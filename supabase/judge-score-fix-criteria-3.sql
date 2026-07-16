-- ============================================================
-- 바디관리(등) 두 번째 카테고리 (a6a22d5a) 복구
--
-- 원인: seed-all 재실행 시 category a6a22d5a의 scoring_criteria가
--       삭제만 되고 재생성되지 않음 → 선수 1004의 점수 고아(orphan) 상태
--
-- 수정:
--   1) a6a22d5a에 scoring_criteria 5개 생성
--   2) 선수 1004 (contestant_id: df8123fb...) 의 scores를
--      새 criterion IDs로 업데이트
-- ============================================================

-- contestant 1004의 현재 점수에서 확인된 old criterion 매핑:
--   08ae9fba → 준비성 (max10)
--   05a0af6c → 연결성 (max30)
--   0816dd73 → 테크닉 (max30)
--   e373c51f → 전문성 (max20)
--   f80c098d → 완성도 (max10)

DO $$
DECLARE
    new_준비성 UUID := gen_random_uuid();
    new_연결성 UUID := gen_random_uuid();
    new_테크닉 UUID := gen_random_uuid();
    new_전문성 UUID := gen_random_uuid();
    new_완성도 UUID := gen_random_uuid();
BEGIN
    -- 1) scoring_criteria 생성
    INSERT INTO scoring_criteria (id, category_id, name, max_score, display_order) VALUES
        (new_준비성, 'a6a22d5a-5f88-4952-b357-997bd544a013', '준비성', 10, 0),
        (new_연결성, 'a6a22d5a-5f88-4952-b357-997bd544a013', '연결성', 30, 1),
        (new_테크닉, 'a6a22d5a-5f88-4952-b357-997bd544a013', '테크닉', 30, 2),
        (new_전문성, 'a6a22d5a-5f88-4952-b357-997bd544a013', '전문성', 20, 3),
        (new_완성도, 'a6a22d5a-5f88-4952-b357-997bd544a013', '완성도', 10, 4);

    -- 2) 선수 1004 점수 업데이트 (contestant_id: df8123fb-7c0e-43cd-a724-1a5f009c2753)
    UPDATE scores SET criterion_id = new_준비성
    WHERE criterion_id = '08ae9fba-1b89-485b-9df2-2838088188d6'
      AND contestant_id = 'df8123fb-7c0e-43cd-a724-1a5f009c2753';

    UPDATE scores SET criterion_id = new_연결성
    WHERE criterion_id = '05a0af6c-3cb7-4115-91ad-b07301a330eb'
      AND contestant_id = 'df8123fb-7c0e-43cd-a724-1a5f009c2753';

    UPDATE scores SET criterion_id = new_테크닉
    WHERE criterion_id = '0816dd73-0b1f-4e2a-9760-978566164b4d'
      AND contestant_id = 'df8123fb-7c0e-43cd-a724-1a5f009c2753';

    UPDATE scores SET criterion_id = new_전문성
    WHERE criterion_id = 'e373c51f-bfd9-4289-ace2-5c3cca9ac8de'
      AND contestant_id = 'df8123fb-7c0e-43cd-a724-1a5f009c2753';

    UPDATE scores SET criterion_id = new_완성도
    WHERE criterion_id = 'f80c098d-681e-4803-8503-07272d3b0978'
      AND contestant_id = 'df8123fb-7c0e-43cd-a724-1a5f009c2753';
END $$;

-- ── 검증 쿼리 (두 결과 모두 0이면 수정 완료) ─────────────────────
SELECT 'criteria_count' AS check_type, COUNT(*) AS result
FROM scoring_criteria
WHERE category_id = 'a6a22d5a-5f88-4952-b357-997bd544a013'
UNION ALL
SELECT 'still_mismatch', COUNT(*)
FROM scores s
WHERE s.contestant_id = 'df8123fb-7c0e-43cd-a724-1a5f009c2753'
  AND s.criterion_id NOT IN (
    SELECT id FROM scoring_criteria
    WHERE category_id = 'a6a22d5a-5f88-4952-b357-997bd544a013'
  );
-- 기대 결과: criteria_count=5, still_mismatch=0
