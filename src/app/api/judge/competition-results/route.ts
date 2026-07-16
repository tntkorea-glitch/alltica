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
      for (const [, group] of byMajor) {
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

  return result;
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
    .select("id, name, grade, company, number, category_id")
    .in("category_id", categoryIds)
    .order("display_order");

  if (!contestants?.length) {
    return NextResponse.json({
      pro_results: [], student_results: [], other_results: [], by_company: [],
      pro_awards: [], student_awards: [], total_pro: 0, total_student: 0,
    });
  }

  const contestantIds = contestants.map((c) => c.id);

  const [{ data: criteria }, { data: scores }, { data: awardSettings }] = await Promise.all([
    supabase.from("scoring_criteria").select("id, category_id, max_score").in("category_id", categoryIds).limit(5000),
    supabase.from("scores").select("contestant_id, criterion_id, score").in("contestant_id", contestantIds).limit(100000),
    supabase.from("competition_award_settings").select("*").eq("competition_id", competitionId).order("display_order"),
  ]);

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

  const proRanked = assignAwards(proSorted, proSettings);
  const studentRanked = assignAwards(studentSorted, studentSettings);

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
