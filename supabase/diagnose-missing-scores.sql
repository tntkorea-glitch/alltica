-- 미집계 선수 진단 (단순버전)
-- competition_id: d5ac70b7-2656-45f0-a7a5-f2ffa68b3b69

SELECT
  c.number,
  c.name,
  c.grade,
  cat.major_category,
  cat.name AS category_name,
  (SELECT COUNT(*) FROM scoring_criteria sc WHERE sc.category_id = c.category_id) AS 기준항목수,
  (SELECT COUNT(DISTINCT s.criterion_id) FROM scores s WHERE s.contestant_id = c.id) AS 채점된항목수,
  (SELECT COUNT(DISTINCT s.criterion_id)
   FROM scores s
   JOIN scoring_criteria sc ON sc.id = s.criterion_id AND sc.category_id = c.category_id
   WHERE s.contestant_id = c.id) AS 유효항목수,
  CASE
    WHEN (SELECT COUNT(*) FROM scoring_criteria sc WHERE sc.category_id = c.category_id) = 0
      THEN '채점기준없음'
    WHEN (SELECT COUNT(*) FROM scores s WHERE s.contestant_id = c.id) = 0
      THEN '점수없음'
    WHEN (SELECT COUNT(DISTINCT s.criterion_id)
          FROM scores s
          JOIN scoring_criteria sc ON sc.id = s.criterion_id AND sc.category_id = c.category_id
          WHERE s.contestant_id = c.id)
       < (SELECT COUNT(*) FROM scoring_criteria sc WHERE sc.category_id = c.category_id)
      THEN 'criterion불일치'
    ELSE '정상'
  END AS 진단
FROM contestants c
JOIN categories cat ON cat.id = c.category_id
WHERE cat.competition_id = 'd5ac70b7-2656-45f0-a7a5-f2ffa68b3b69'
  AND (
    (SELECT COUNT(DISTINCT s.criterion_id)
     FROM scores s
     JOIN scoring_criteria sc ON sc.id = s.criterion_id AND sc.category_id = c.category_id
     WHERE s.contestant_id = c.id)
    <
    (SELECT COUNT(*) FROM scoring_criteria sc WHERE sc.category_id = c.category_id)
  )
ORDER BY 진단, cat.major_category, cat.name, c.number;
