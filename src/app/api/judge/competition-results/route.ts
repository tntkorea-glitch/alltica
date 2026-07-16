import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

interface AwardSetting {
  id: string;
  award_name: string;
  count: number | null;
  percent: number | null;
  per_major_category: boolean;
  min_group_size: number | null;
  display_order: number;
}

interface ContestantResult {
  id: string;
  name: string;
  grade: string | null;
  company: string | null;
  number: number | null;
  category_id: string;
  category_name: string;
  major_category: string | null;
  raw_score: number | null;
  max_score: number;
  normalized_score: number | null;
  rank: number | null;
  award: string | null;
  manual_award: string | null;
}

function assignAwards(sorted: ContestantResult[], settings: AwardSetting[]): ContestantResult[] {
  const result = sorted.map((c) => ({ ...c }));
  const assigned = new Set<string>();
  const scoredCount = result.filter((c) => c.normalized_score !== null).length;

  for (const setting of settings) {
    if (setting.per_major_category) {
      const byMajor = new Map<string, ContestantResult[]>();
      for (const c of result) {
        if (!assigned.has(c.id) && c.normalized_score !== null) {
          const mc = c.major_category ?? "기타";
          if (!byMajor.has(mc)) byMajor.set(mc, []);
          byMajor.get(mc)!.push(c);
        }
      }
      const minSize = setting.min_group_size ?? 1;
      for (const [, group] of byMajor) {
        if (group.length < minSize) continue;
        const n = setting.count ?? 1;
        for (let i = 0; i < Math.min(n, group.length); i++) {
          const found = result.find((r) => r.id === group[i].id);
          if (found) { found.award = setting.award_name; assigned.add(group[i].id); }
        }
      }
    } else {
      const n =
        setting.percent !== null
          ? Math.max(1, Math.round((setting.percent / 100) * scoredCount))
          : (setting.count ?? 0);
      let given = 0;
      for (const c of result) {
        if (!assigned.has(c.id) && c.normalized_score !== null && given < n) {
          c.award = setting.award_name;
          assigned.add(c.id);
          given++;
        }
      }
    }
  }

  let rank = 1;
  for (const c of result) {
    if (c.normalized_score !== null) c.rank = rank++;
  }

  // manual_award 오버라이드 적용
  for (const c of result) {
    if (c.manual_award !== null && c.manual_award !== undefined) {
      c.award = c.manual_award;
    }
  }

  return result;
}

// 동일인 다종목 시상 중복 제거: 같은 사람이 같은 상을 2개 이상 받은 경우
// 점수가 낮은 쪽을 한 단계 내림 (더 낮은 tier). 내릴 수 없으면 한 단계 올림.
function deduplicateMultiCategoryAwards(
  results: ContestantResult[],
  awardNames: string[] // display_order 순서 (0=최고 tier)
): ContestantResult[] {
  if (awardNames.length < 2) return results;

  // 이름+회사+부문 기준으로 같은 사람 묶기
  const personMap = new Map<string, ContestantResult[]>();
  for (const r of results) {
    const key = `${r.name}|${r.company ?? ""}|${r.grade ?? ""}`;
    if (!personMap.has(key)) personMap.set(key, []);
    personMap.get(key)!.push(r);
  }

  const out = results.map(r => ({ ...r }));

  for (const [, group] of personMap) {
    if (group.length < 2) continue;

    // 점수 내림차순 정렬 (높은 점수 = 더 좋은 성적)
    const sorted = [...group].sort((a, b) => (b.normalized_score ?? -1) - (a.normalized_score ?? -1));

    // 각 행 순회하며 중복 상 감지 → 조정
    const usedAwards = new Set<string>();
    for (const r of sorted) {
      if (!r.award) continue;

      if (!usedAwards.has(r.award)) {
        usedAwards.add(r.award);
        continue;
      }

      // 중복 발생: 이 row의 award를 조정
      const idx = awardNames.indexOf(r.award);
      let newAward: string | null = null;

      // 한 단계 내림 (tier 낮춤 = index 높임 = 덜 좋은 상)
      for (let i = idx + 1; i < awardNames.length; i++) {
        if (!usedAwards.has(awardNames[i])) {
          newAward = awardNames[i];
          break;
        }
      }
      // 내릴 상 없으면 한 단계 올림
      if (!newAward) {
        for (let i = idx - 1; i >= 0; i--) {
          if (!usedAwards.has(awardNames[i])) {
            newAward = awardNames[i];
            break;
          }
        }
      }

      if (newAward) {
        const target = out.find(o => o.id === r.id);
        if (target) target.award = newAward;
        usedAwards.add(newAward);
      }
    }
  }

  return out;
}

export async function GET(request: NextRequest) {
  const ctx = await getJudgeContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const competitionId = request.nextUrl.searchParams.get("competition_id");
  if (!competitionId) return NextResponse.json({ error: "competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, major_category, display_order")
    .eq("competition_id", competitionId)
    .order("display_order");

  if (!categories?.length) {
    return NextResponse.json({
      pro_results: [], student_results: [], other_results: [], by_company: [],
      pro_awards: [], student_awards: [], total_pro: 0, total_student: 0,
    });
  }

  const categoryIds = categories.map((c) => c.id);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const { data: contestants } = await supabase
    .from("contestants")
    .select("id, name, grade, company, number, category_id, manual_award")
    .in("category_id", categoryIds)
    .order("display_order");

  if (!contestants?.length) {
    return NextResponse.json({
      pro_results: [], student_results: [], other_results: [], by_company: [],
      pro_awards: [], student_awards: [], total_pro: 0, total_student: 0,
    });
  }

  const contestantIds = contestants.map((c) => c.id);

  // Batch scores queries to bypass Supabase server-side 1000-row limit
  // 총 점수 3192개 / 127명 = 25점/명 → batch=15이면 375점/배치 (1000 한도 안전)
  const SCORE_BATCH = 15;
  const scoreBatches: string[][] = [];
  for (let i = 0; i < contestantIds.length; i += SCORE_BATCH) {
    scoreBatches.push(contestantIds.slice(i, i + SCORE_BATCH));
  }
  const [criteriaRes, awardSettingsRes, ...scoreBatchResults] = await Promise.all([
    supabase.from("scoring_criteria").select("id, category_id, max_score").in("category_id", categoryIds).limit(5000),
    supabase.from("competition_award_settings").select("*").eq("competition_id", competitionId).order("display_order"),
    ...scoreBatches.map(batch =>
      supabase.from("scores").select("contestant_id, criterion_id, score").in("contestant_id", batch)
    ),
  ]);
  const criteria = criteriaRes.data;
  const awardSettings = awardSettingsRes.data;
  const scores = scoreBatchResults.flatMap(r => (r as { data: { contestant_id: string; criterion_id: string; score: number }[] | null }).data ?? []);

  const criteriaByCategory = new Map<string, { id: string; max_score: number }[]>();
  for (const cr of criteria ?? []) {
    if (!criteriaByCategory.has(cr.category_id)) criteriaByCategory.set(cr.category_id, []);
    criteriaByCategory.get(cr.category_id)!.push(cr);
  }

  const allResults: ContestantResult[] = contestants.map((contestant) => {
    const cat = categoryMap.get(contestant.category_id);
    const catCriteria = criteriaByCategory.get(contestant.category_id) ?? [];
    const cScores = (scores ?? []).filter((s) => s.contestant_id === contestant.id);

    let total = 0;
    let maxPossible = 0;
    let hasAll = catCriteria.length > 0;

    for (const cr of catCriteria) {
      const crScores = cScores.filter((s) => s.criterion_id === cr.id);
      if (crScores.length === 0) { hasAll = false; continue; }
      const avg = crScores.reduce((a, b) => a + b.score, 0) / crScores.length;
      total += avg;
      maxPossible += cr.max_score;
    }

    const normalized = hasAll && maxPossible > 0 ? (total / maxPossible) * 100 : null;

    return {
      id: contestant.id,
      name: contestant.name,
      grade: contestant.grade ?? null,
      company: contestant.company ?? null,
      number: contestant.number ?? null,
      category_id: contestant.category_id,
      category_name: cat?.name ?? "",
      major_category: cat?.major_category ?? null,
      raw_score: hasAll ? total : null,
      max_score: maxPossible,
      normalized_score: normalized !== null ? Math.round(normalized * 100) / 100 : null,
      rank: null,
      award: null,
      manual_award: (contestant as { manual_award?: string | null }).manual_award ?? null,
    };
  });

  const proSettings = (awardSettings ?? []).filter((s) => s.grade === "프로전문가부");
  const studentSettings = (awardSettings ?? []).filter((s) => s.grade === "학생부");

  const desc = (a: ContestantResult, b: ContestantResult) =>
    (b.normalized_score ?? -1) - (a.normalized_score ?? -1);

  const proSorted = allResults.filter((c) => c.grade === "프로전문가부").sort(desc);
  const studentSorted = allResults.filter((c) => c.grade === "학생부").sort(desc);
  const otherSorted = allResults
    .filter((c) => !c.grade || (c.grade !== "프로전문가부" && c.grade !== "학생부"))
    .sort(desc);

  const proAwardNames = proSettings.map(s => s.award_name);
  const studentAwardNames = studentSettings.map(s => s.award_name);

  const proRanked = deduplicateMultiCategoryAwards(
    assignAwards(proSorted, proSettings), proAwardNames
  );
  const studentRanked = deduplicateMultiCategoryAwards(
    assignAwards(studentSorted, studentSettings), studentAwardNames
  );

  // by_company: 단체별 그룹
  const companyMap = new Map<string, { pro: ContestantResult[]; student: ContestantResult[]; other: ContestantResult[] }>();
  const add = (c: ContestantResult, key: "pro" | "student" | "other") => {
    const co = c.company || "단체 미지정";
    if (!companyMap.has(co)) companyMap.set(co, { pro: [], student: [], other: [] });
    companyMap.get(co)![key].push(c);
  };
  for (const c of proRanked) add(c, "pro");
  for (const c of studentRanked) add(c, "student");
  for (const c of otherSorted) add(c, "other");

  const byCompany = [...companyMap.entries()]
    .map(([company, g]) => ({
      company,
      pro: g.pro,
      student: g.student,
      other: g.other,
      awarded_count: [...g.pro, ...g.student, ...g.other].filter((x) => x.award).length,
    }))
    .sort((a, b) => a.company.localeCompare(b.company, "ko"));

  return NextResponse.json({
    pro_results: proRanked,
    student_results: studentRanked,
    other_results: otherSorted,
    by_company: byCompany,
    pro_awards: proSettings,
    student_awards: studentSettings,
    total_pro: proSorted.length,
    total_student: studentSorted.length,
  });
}
