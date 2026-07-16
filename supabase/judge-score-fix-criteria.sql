-- ============================================================
-- 블로드라이(인컬/아웃컬) scores criterion_id 불일치 수정
--
-- 원인: scoring_criteria seed-all 재실행으로 criterion IDs가 바뀌었으나
--       기존 채점 scores는 이전(블로드라이 main과 같은) IDs를 참조 중.
--
-- 수정: 해당 카테고리 선수들의 scores criterion_id를
--       현재 scoring_criteria의 올바른 IDs로 업데이트
-- ============================================================

-- ── 블로드라이(인컬) 수정 ─────────────────────────────────────
-- category_id: 3cb97428-b90a-45b4-a3a2-8036b53cb21c
UPDATE scores
SET criterion_id = '8c3eb54d-0e63-4b89-a48a-528b1610460d'  -- 창의성 (new)
WHERE criterion_id = 'f7c3dca9-531a-44d1-b1e3-005ec4c954f0' -- 창의성 (old = 블로드라이 main)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = '3cb97428-b90a-45b4-a3a2-8036b53cb21c'
  );

UPDATE scores
SET criterion_id = 'bff52eec-bf23-469c-9334-6b14625a67ed'  -- 테크닉 (new)
WHERE criterion_id = '5e4bda4b-c586-4c7d-a307-15daab3521be' -- 테크닉 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = '3cb97428-b90a-45b4-a3a2-8036b53cb21c'
  );

UPDATE scores
SET criterion_id = 'ea6b2fd4-f88c-4026-9993-8e1fb6fc80f2'  -- 예술성 (new)
WHERE criterion_id = '4d7dc831-103f-4679-aafe-2cf9b8574b17' -- 예술성 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = '3cb97428-b90a-45b4-a3a2-8036b53cb21c'
  );

UPDATE scores
SET criterion_id = '56d1ec1b-bec7-4c3b-afaf-e41cede818d8'  -- 조화미 (new)
WHERE criterion_id = 'f6fb56a2-649d-4c9c-afa6-65861562e407' -- 조화미 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = '3cb97428-b90a-45b4-a3a2-8036b53cb21c'
  );

UPDATE scores
SET criterion_id = 'd2d952bc-c36a-4343-908d-5d21c57c5253'  -- 완성도 (new)
WHERE criterion_id = '65a8acbb-9645-4654-8436-b0214de9d7aa' -- 완성도 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = '3cb97428-b90a-45b4-a3a2-8036b53cb21c'
  );

-- ── 블로드라이(아웃컬) 수정 ───────────────────────────────────
-- category_id: f50c542d-4dec-44ab-a39b-046c46a84b1d
UPDATE scores
SET criterion_id = 'f7b68f4e-618b-4a3b-936c-a97eeab9a1dd'  -- 창의성 (new)
WHERE criterion_id = 'f7c3dca9-531a-44d1-b1e3-005ec4c954f0' -- 창의성 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = 'f50c542d-4dec-44ab-a39b-046c46a84b1d'
  );

UPDATE scores
SET criterion_id = 'c9e1559c-c73b-48ac-a0de-b53180d7ade5'  -- 테크닉 (new)
WHERE criterion_id = '5e4bda4b-c586-4c7d-a307-15daab3521be' -- 테크닉 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = 'f50c542d-4dec-44ab-a39b-046c46a84b1d'
  );

UPDATE scores
SET criterion_id = 'd7347067-b6bd-43d2-8e91-70c3643a5d34'  -- 예술성 (new)
WHERE criterion_id = '4d7dc831-103f-4679-aafe-2cf9b8574b17' -- 예술성 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = 'f50c542d-4dec-44ab-a39b-046c46a84b1d'
  );

UPDATE scores
SET criterion_id = '14311961-1536-4127-aef1-162e4c40934e'  -- 조화미 (new)
WHERE criterion_id = 'f6fb56a2-649d-4c9c-afa6-65861562e407' -- 조화미 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = 'f50c542d-4dec-44ab-a39b-046c46a84b1d'
  );

UPDATE scores
SET criterion_id = 'ad0a8fb8-eaf8-49e7-878d-d4d7e9d3c105'  -- 완성도 (new)
WHERE criterion_id = '65a8acbb-9645-4654-8436-b0214de9d7aa' -- 완성도 (old)
  AND contestant_id IN (
    SELECT id FROM contestants WHERE category_id = 'f50c542d-4dec-44ab-a39b-046c46a84b1d'
  );

-- ── 검증 쿼리 (실행 후 확인용) ────────────────────────────────
-- 아래 쿼리 결과가 0이면 수정 완료:
SELECT COUNT(*) AS still_mismatch
FROM scores s
WHERE s.contestant_id IN (
    SELECT id FROM contestants
    WHERE category_id IN (
        '3cb97428-b90a-45b4-a3a2-8036b53cb21c',
        'f50c542d-4dec-44ab-a39b-046c46a84b1d'
    )
)
AND s.criterion_id NOT IN (
    SELECT id FROM scoring_criteria
    WHERE category_id IN (
        '3cb97428-b90a-45b4-a3a2-8036b53cb21c',
        'f50c542d-4dec-44ab-a39b-046c46a84b1d'
    )
);
