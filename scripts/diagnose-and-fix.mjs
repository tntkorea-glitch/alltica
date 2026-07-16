import { createClient } from "@supabase/supabase-js";
import fs from "fs";

import { readFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync(".env.local","utf8").split("\n")
    .filter(l=>l.includes("="))
    .map(l=>{const i=l.indexOf("=");return[l.slice(0,i),l.slice(i+1).trim()];})
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const COMPETITION_ID = "d5ac70b7-2656-45f0-a7a5-f2ffa68b3b69";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 1. 카테고리
  const { data: categories } = await sb.from("categories")
    .select("id, name, major_category").eq("competition_id", COMPETITION_ID);
  const catMap = new Map(categories.map(c => [c.id, c]));
  const catIds = categories.map(c => c.id);

  // 2. 선수
  const { data: contestants } = await sb.from("contestants")
    .select("id, name, grade, number, category_id").in("category_id", catIds).order("number");

  // 3. criteria (category별)
  const { data: criteria } = await sb.from("scoring_criteria")
    .select("id, category_id, name, display_order, max_score").in("category_id", catIds).order("display_order");
  const criteriaByCategory = new Map();
  for (const cr of criteria) {
    if (!criteriaByCategory.has(cr.category_id)) criteriaByCategory.set(cr.category_id, []);
    criteriaByCategory.get(cr.category_id).push(cr);
  }

  // 4. scores (batched) — contestant_id + criterion_id
  const cIds = contestants.map(c => c.id);
  let allScores = [];
  for (let i = 0; i < cIds.length; i += 50) {
    const { data } = await sb.from("scores")
      .select("contestant_id, criterion_id").in("contestant_id", cIds.slice(i, i + 50));
    allScores = allScores.concat(data ?? []);
  }

  // 5. 각 선수 × 카테고리 기준으로 정확하게 판별
  const missingList = [];
  const criteriaSet = new Set(criteria.map(cr => cr.id)); // 전체 유효 criterion IDs

  for (const c of contestants) {
    const catCriteria = criteriaByCategory.get(c.category_id) ?? [];
    if (catCriteria.length === 0) continue; // 기준 없으면 skip (별도 처리)

    // 이 선수의 점수 중 이 카테고리 criterion에 해당하는 것만
    const validCriterionIds = new Set(catCriteria.map(cr => cr.id));
    const myScores = allScores.filter(s => s.contestant_id === c.id);
    const myValidScores = myScores.filter(s => validCriterionIds.has(s.criterion_id));
    const scoredCriterionIds = new Set(myValidScores.map(s => s.criterion_id));

    const missing = catCriteria.filter(cr => !scoredCriterionIds.has(cr.id));
    if (missing.length === 0) continue; // 정상

    // 이 선수가 갖고 있는 "잘못된 criterion_ids" (orphan scores)
    const orphanIds = myScores.filter(s => !criteriaSet.has(s.criterion_id)).map(s => s.criterion_id);
    const wrongCatIds = myScores.filter(s => criteriaSet.has(s.criterion_id) && !validCriterionIds.has(s.criterion_id)).map(s => s.criterion_id);

    missingList.push({
      number: c.number, name: c.name, grade: c.grade,
      category_id: c.category_id, category_name: catMap.get(c.category_id)?.name,
      major: catMap.get(c.category_id)?.major_category,
      total_score_rows: myScores.length,
      valid_scores: myValidScores.length,
      missing_criteria: missing.map(m => ({ id: m.id, name: m.name, order: m.display_order })),
      orphan_criterion_ids: orphanIds,   // DB에 없는 criterion
      wrong_cat_criterion_ids: wrongCatIds, // 다른 카테고리 criterion
    });
  }

  console.log(`\n=== 미집계 선수 정밀 진단 === 총 ${missingList.length}명\n`);

  // 그룹: 완전 채점 없음 vs 부분 채점
  const noScores = missingList.filter(x => x.total_score_rows === 0);
  const wrongCrit = missingList.filter(x => x.total_score_rows > 0 && x.wrong_cat_criterion_ids.length > 0);
  const partial = missingList.filter(x => x.total_score_rows > 0 && x.wrong_cat_criterion_ids.length === 0);

  console.log(`[A] 점수 자체 없음: ${noScores.length}명`);
  for (const c of noScores) console.log(`  번${c.number} ${c.name} | ${c.major}-${c.category_name}`);

  console.log(`\n[B] criterion_id 불일치 (타 카테고리 기준 점수): ${wrongCrit.length}명`);
  for (const c of wrongCrit) {
    console.log(`  번${c.number} ${c.name} | ${c.major}-${c.category_name} | 잘못된 criterion: ${c.wrong_cat_criterion_ids.slice(0,3).join(",")}`);
  }

  console.log(`\n[C] 부분 채점 (일부 항목 누락): ${partial.length}명`);
  for (const c of partial) console.log(`  번${c.number} ${c.name} | ${c.major}-${c.category_name} | 누락: ${c.missing_criteria.map(m=>m.name).join(",")}`);

  // [B] criterion 불일치 → SQL FIX 자동 생성
  if (wrongCrit.length > 0) {
    console.log("\n\n=== 자동 생성 SQL FIX (B 그룹) ===");
    const sqlLines = ["-- criterion_id 불일치 자동 수정 SQL", "-- 생성 기준: 타 카테고리 점수를 올바른 카테고리 기준으로 매핑 (display_order 순서 기준)"];

    // 카테고리별로 그룹핑
    const byCat = new Map();
    for (const c of wrongCrit) {
      if (!byCat.has(c.category_id)) byCat.set(c.category_id, []);
      byCat.get(c.category_id).push(c);
    }

    for (const [catId, conts] of byCat) {
      const catCriteria = criteriaByCategory.get(catId);
      const catName = catMap.get(catId)?.name;
      sqlLines.push(`\n-- 카테고리: ${catName} (${catId})`);

      // 이 카테고리 선수들의 잘못된 criterion_ids 수집
      const allWrongIds = new Set();
      for (const c of conts) c.wrong_cat_criterion_ids.forEach(id => allWrongIds.add(id));

      // 잘못된 criterion_id들이 어느 카테고리 것인지 찾기
      const wrongCriteriaInfo = criteria.filter(cr => allWrongIds.has(cr.id));

      // display_order 매핑: 잘못된 것의 display_order → 올바른 것의 id
      const correctByOrder = new Map(catCriteria.map(cr => [cr.display_order, cr]));
      const wrongByOrder = new Map(wrongCriteriaInfo.map(cr => [cr.display_order, cr]));

      for (const [order, wrongCr] of wrongByOrder) {
        const correctCr = correctByOrder.get(order);
        if (!correctCr) continue;
        const contestantIds = conts.map(c => `'${c.category_id.replace(/-/g,'-')}'`); // placeholder
        const actualConts = conts.filter(c => c.wrong_cat_criterion_ids.includes(wrongCr.id));
        if (actualConts.length === 0) continue;
        const contIdList = actualConts.map(c => `(SELECT id FROM contestants WHERE number=${c.number} AND category_id='${catId}')`).join(",\n    ");
        sqlLines.push(`-- ${wrongCr.name}(order${order}): ${wrongCr.id} → ${correctCr.id}`);
        sqlLines.push(`UPDATE scores SET criterion_id = '${correctCr.id}'`);
        sqlLines.push(`WHERE criterion_id = '${wrongCr.id}'`);
        sqlLines.push(`  AND contestant_id IN (\n    ${contIdList}\n  );`);
      }
    }

    const sqlContent = sqlLines.join("\n");
    fs.writeFileSync("supabase/judge-score-fix-auto.sql", sqlContent);
    console.log("\n→ supabase/judge-score-fix-auto.sql 생성 완료");
  }
}

main().catch(console.error);
