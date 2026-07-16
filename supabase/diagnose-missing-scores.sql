-- ============================================================
-- 미집계 선수 진단 — normalized_score = null 원인 분석
-- competition_id: d5ac70b7-2656-45f0-a7a5-f2ffa68b3b69
-- ============================================================

WITH comp_contestants AS (
  SELECT c.id, c.name, c.grade, c.number, c.category_id,
         cat.name AS category_name, cat.major_category
  FROM contestants c
  JOIN categories cat ON cat.id = c.category_id
  WHERE cat.competition_id = 'd5ac70b7-2656-45f0-a7a5-f2ffa68b3b69'
),
criteria_per_cat AS (
  SELECT sc.category_id, COUNT(*) AS criteria_count
  FROM scoring_criteria sc
  JOIN categories cat ON cat.id = sc.category_id
  WHERE cat.competition_id = 'd5ac70b7-2656-45f0-a7a5-f2ffa68b3b69'
  GROUP BY sc.category_id
),
scores_per_contestant AS (
  SELECT s.contestant_id,
         COUNT(DISTINCT s.criterion_id) AS scored_criteria,
         COUNT(*) AS total_score_rows
  FROM scores s
  JOIN comp_contestants cc ON cc.id = s.contestant_id
  GROUP BY s.contestant_id
),
valid_scores AS (
  -- 점수가 올바른 criterion_id에 연결된 것만
  SELECT s.contestant_id,
         COUNT(DISTINCT s.criterion_id) AS valid_criteria
  FROM scores s
  JOIN comp_contestants cc ON cc.id = s.contestant_id
  JOIN scoring_criteria sc ON sc.id = s.criterion_id
                          AND sc.category_id = cc.category_id
  GROUP BY s.contestant_id
)
SELECT
  cc.number,
  cc.name,
  cc.grade,
  cc.category_name,
  cc.major_category,
  COALESCE(cpc.criteria_count, 0)  AS 기준항목수,
  COALESCE(spc.scored_criteria, 0) AS 채점된criterion수,
  COALESCE(vs.valid_criteria, 0)   AS 유효criterion수,
  CASE
    WHEN COALESCE(cpc.criteria_count, 0) = 0
         THEN '❌ 카테고리에 채점기준 없음'
    WHEN COALESCE(spc.total_score_rows, 0) = 0
         THEN '❌ 점수 없음 (채점 안됨)'
    WHEN COALESCE(vs.valid_criteria, 0) < COALESCE(cpc.criteria_count, 0)
         THEN '⚠️ criterion_id 불일치 (SQL 수정 필요)'
    WHEN COALESCE(vs.valid_criteria, 0) >= COALESCE(cpc.criteria_count, 0)
         THEN '✅ 정상 (집계 가능)'
    ELSE '❓ 알 수 없음'
  END AS 진단
FROM comp_contestants cc
LEFT JOIN criteria_per_cat cpc ON cpc.category_id = cc.category_id
LEFT JOIN scores_per_contestant spc ON spc.contestant_id = cc.id
LEFT JOIN valid_scores vs ON vs.contestant_id = cc.id
WHERE
  -- 미집계 가능성 있는 선수만 (유효 criterion < 기준 항목수)
  COALESCE(vs.valid_criteria, 0) < COALESCE(cpc.criteria_count, 1)
ORDER BY 진단, cc.major_category, cc.category_name, cc.number;
