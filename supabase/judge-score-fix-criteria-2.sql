-- ============================================================
-- 추가 7개 카테고리 criterion_id 불일치 수정
--
-- 원인: scoring_criteria seed-all 재실행으로 criterion IDs가 바뀌었으나
--       기존 채점 scores는 이전 IDs를 참조 중.
--
-- 매핑 방법: old criterion IDs의 max submitted score를 확인하여
--            같은 max_score를 가진 new criterion으로 정확히 매핑.
-- ============================================================

-- ── 창작아트 (category_id: 729e5e53-1227-4d46-b07b-fbac5fcedbe2) ──
-- 기준: 디자인(30), 난이도(40), 완성도(30)
UPDATE scores SET criterion_id = '0bfa2d89-6605-4158-b512-379b9411dd4b'  -- 디자인 (new)
WHERE criterion_id = 'e5069d9c-4112-4a49-b651-98e31c0f84e8'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '729e5e53-1227-4d46-b07b-fbac5fcedbe2');

UPDATE scores SET criterion_id = '5efe759b-73b7-43e3-b241-d39bea4886bf'  -- 난이도 (new)
WHERE criterion_id = 'e59eca9a-3be9-4da1-873f-d8e62c526eda'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '729e5e53-1227-4d46-b07b-fbac5fcedbe2');

UPDATE scores SET criterion_id = '2abe9bde-991e-4159-99e5-3618269c7378'  -- 완성도 (new)
WHERE criterion_id = 'e8a84257-9adb-4638-93a7-754ef0299bbf'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '729e5e53-1227-4d46-b07b-fbac5fcedbe2');

-- ── 패디아트 (category_id: c8e25b83-df11-4eac-812d-d4a10f98e148) ──
-- 기준: 디자인(30), 난이도(40), 완성도(30)
UPDATE scores SET criterion_id = '137edae0-8e8f-4a09-bc6e-a9393f2f451a'  -- 디자인 (new)
WHERE criterion_id = 'e5069d9c-4112-4a49-b651-98e31c0f84e8'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'c8e25b83-df11-4eac-812d-d4a10f98e148');

UPDATE scores SET criterion_id = '5537eaa3-f985-496c-aca1-dc356602efad'  -- 난이도 (new)
WHERE criterion_id = 'e59eca9a-3be9-4da1-873f-d8e62c526eda'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'c8e25b83-df11-4eac-812d-d4a10f98e148');

UPDATE scores SET criterion_id = 'b2287d5a-ae4b-4025-ab20-cc2a4232e528'  -- 완성도 (new)
WHERE criterion_id = 'e8a84257-9adb-4638-93a7-754ef0299bbf'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'c8e25b83-df11-4eac-812d-d4a10f98e148');

-- ── 바디관리(등) (category_id: ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3) ──
-- 기준: 준비성(10), 연결성(30), 테크닉(30), 전문성(20), 완성도(10)
-- max_score 기반 매핑: 05a0af6c=30→연결성, 0816dd73=30→테크닉, 08ae9fba=10→준비성, e373c51f=20→전문성, f80c098d=10→완성도
UPDATE scores SET criterion_id = '36784e83-86bd-478c-877d-5eb1b69d5b53'  -- 연결성 (max30)
WHERE criterion_id = '05a0af6c-3cb7-4115-91ad-b07301a330eb'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3');

UPDATE scores SET criterion_id = '444520b0-b520-4bca-ad87-99524416f568'  -- 테크닉 (max30)
WHERE criterion_id = '0816dd73-0b1f-4e2a-9760-978566164b4d'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3');

UPDATE scores SET criterion_id = 'bf67a361-0acc-44c8-a581-34651717732b'  -- 준비성 (max10)
WHERE criterion_id = '08ae9fba-1b89-485b-9df2-2838088188d6'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3');

UPDATE scores SET criterion_id = '86320475-4e6e-4c20-9487-d0b71a75c8a8'  -- 전문성 (max20)
WHERE criterion_id = 'e373c51f-bfd9-4289-ace2-5c3cca9ac8de'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3');

UPDATE scores SET criterion_id = 'fc414e12-b997-425b-af3a-2dfd3fcf0c0d'  -- 완성도 (max10)
WHERE criterion_id = 'f80c098d-681e-4803-8503-07272d3b0978'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = 'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3');

-- ── 원랭스(이사도라) (category_id: 24211003-2630-4cfe-a980-ee17afbe6010) ──
-- 기준: 테크닉(25), 예술성(25), 조화미(25), 완성도(25)
UPDATE scores SET criterion_id = '7344387e-b4a4-447d-bbfc-6b8dc41b6185'  -- 테크닉
WHERE criterion_id = '419b3bf6-17c4-4baf-89a8-8e14975b5128'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '24211003-2630-4cfe-a980-ee17afbe6010');

UPDATE scores SET criterion_id = 'ff82cdfa-5483-4391-b75c-5422790bed06'  -- 예술성
WHERE criterion_id = 'd5170da6-c7d0-49bf-a931-31afb78f975d'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '24211003-2630-4cfe-a980-ee17afbe6010');

UPDATE scores SET criterion_id = 'ae7c3eb8-2a77-4ea5-885a-c032004d2bb2'  -- 조화미
WHERE criterion_id = 'f31547e6-6780-4d87-9978-ec3368b472f5'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '24211003-2630-4cfe-a980-ee17afbe6010');

UPDATE scores SET criterion_id = '34ab004b-4c8e-48e7-96fa-cb7a95b683d0'  -- 완성도
WHERE criterion_id = 'f5b3b56e-4dab-40da-96ca-69ad7d973c4a'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '24211003-2630-4cfe-a980-ee17afbe6010');

-- ── 원랭스(그래듀에이션) (category_id: 14d02214-e7c0-430d-99f1-f42ea0688ef8) ──
-- 기준: 테크닉(25), 예술성(25), 조화미(25), 완성도(25)
UPDATE scores SET criterion_id = '1cf0a89a-ebdc-430f-af1b-60dc82bf5d87'  -- 테크닉
WHERE criterion_id = '419b3bf6-17c4-4baf-89a8-8e14975b5128'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '14d02214-e7c0-430d-99f1-f42ea0688ef8');

UPDATE scores SET criterion_id = '3f794a01-95d2-4280-ae8e-d6632c1dc4e2'  -- 예술성
WHERE criterion_id = 'd5170da6-c7d0-49bf-a931-31afb78f975d'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '14d02214-e7c0-430d-99f1-f42ea0688ef8');

UPDATE scores SET criterion_id = 'c45f5bbf-811c-44ec-a575-b6abf9dc7b98'  -- 조화미
WHERE criterion_id = 'f31547e6-6780-4d87-9978-ec3368b472f5'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '14d02214-e7c0-430d-99f1-f42ea0688ef8');

UPDATE scores SET criterion_id = 'd154429a-9e43-4420-bac0-6f5e83366cfa'  -- 완성도
WHERE criterion_id = 'f5b3b56e-4dab-40da-96ca-69ad7d973c4a'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '14d02214-e7c0-430d-99f1-f42ea0688ef8');

-- ── 살롱헤어커트(맨즈컷) (category_id: 486450a4-fe89-46d2-9be1-dc457878a096) ──
-- 기준: 테크닉(25), 예술성(25), 조화미(25), 완성도(25)
UPDATE scores SET criterion_id = '8390c626-320d-4311-aa47-42e4d292b328'  -- 테크닉
WHERE criterion_id = '40f1d981-c788-4401-aadc-556bb23bef7d'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '486450a4-fe89-46d2-9be1-dc457878a096');

UPDATE scores SET criterion_id = '96a9193a-5c9e-4074-b4f4-a95ed182f86d'  -- 예술성
WHERE criterion_id = '53d54fcc-1d75-414a-886d-7e41eaf22428'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '486450a4-fe89-46d2-9be1-dc457878a096');

UPDATE scores SET criterion_id = '0bd4a306-799c-4dcc-a138-ce923d2cd8fa'  -- 조화미
WHERE criterion_id = 'b293b56c-ef44-4594-8ac8-9def0a1cdf6b'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '486450a4-fe89-46d2-9be1-dc457878a096');

UPDATE scores SET criterion_id = '620c6a69-11f9-4ca8-a018-7bca74e1aa69'  -- 완성도
WHERE criterion_id = 'cd991a5f-a6b7-4cfc-bc4c-8657e552922b'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '486450a4-fe89-46d2-9be1-dc457878a096');

-- ── 바디(팔) (category_id: 1627ec39-2185-482f-acac-a137c6f55736) ──
-- 기준: 준비성(10), 연결성(30), 테크닉(30), 전문성(20), 완성도(10)
-- max_score 기반 매핑: 04e9a9a3=30→연결성, 21a924e5=10→준비성, 8a05a7e3=20→전문성, dd0e5678=30→테크닉, f245b5c9=10→완성도
UPDATE scores SET criterion_id = '2999b651-e06c-4652-b030-261e7b5127a5'  -- 연결성 (max30)
WHERE criterion_id = '04e9a9a3-652b-427d-877b-33e2ba99a264'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '1627ec39-2185-482f-acac-a137c6f55736');

UPDATE scores SET criterion_id = 'db84cfa3-01b6-4cc1-bd3b-b7fe6ce09fa2'  -- 준비성 (max10)
WHERE criterion_id = '21a924e5-35bc-421c-ad82-e09b6de61685'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '1627ec39-2185-482f-acac-a137c6f55736');

UPDATE scores SET criterion_id = 'f8183400-c226-4cd9-bcc9-1517b0f1aa1e'  -- 전문성 (max20)
WHERE criterion_id = '8a05a7e3-0d4a-4938-aa5d-d747c42ac157'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '1627ec39-2185-482f-acac-a137c6f55736');

UPDATE scores SET criterion_id = '3591ad60-71fb-48af-92af-cda05294c67c'  -- 테크닉 (max30)
WHERE criterion_id = 'dd0e5678-f1a6-427c-aa9a-00acbedafc08'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '1627ec39-2185-482f-acac-a137c6f55736');

UPDATE scores SET criterion_id = '86621224-0222-4224-8db9-1ac500582125'  -- 완성도 (max10)
WHERE criterion_id = 'f245b5c9-9d8a-4f59-9f4b-a979290a4505'
  AND contestant_id IN (SELECT id FROM contestants WHERE category_id = '1627ec39-2185-482f-acac-a137c6f55736');

-- ── 검증 쿼리 (실행 후 확인용, 결과가 0이면 수정 완료) ────────────
SELECT COUNT(*) AS still_mismatch
FROM scores s
WHERE s.contestant_id IN (
    SELECT id FROM contestants WHERE category_id IN (
        '729e5e53-1227-4d46-b07b-fbac5fcedbe2',
        'c8e25b83-df11-4eac-812d-d4a10f98e148',
        'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3',
        '24211003-2630-4cfe-a980-ee17afbe6010',
        '14d02214-e7c0-430d-99f1-f42ea0688ef8',
        '486450a4-fe89-46d2-9be1-dc457878a096',
        '1627ec39-2185-482f-acac-a137c6f55736'
    )
)
AND s.criterion_id NOT IN (
    SELECT id FROM scoring_criteria WHERE category_id IN (
        '729e5e53-1227-4d46-b07b-fbac5fcedbe2',
        'c8e25b83-df11-4eac-812d-d4a10f98e148',
        'ffa86bdf-d1bb-495d-93c8-fb60d0c9c1e3',
        '24211003-2630-4cfe-a980-ee17afbe6010',
        '14d02214-e7c0-430d-99f1-f42ea0688ef8',
        '486450a4-fe89-46d2-9be1-dc457878a096',
        '1627ec39-2185-482f-acac-a137c6f55736'
    )
);
