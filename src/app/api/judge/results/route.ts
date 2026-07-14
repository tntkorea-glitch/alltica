import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const categoryId = request.nextUrl.searchParams.get("category_id");
  if (!categoryId) return NextResponse.json({ error: "category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const [{ data: contestants }, { data: criteria }, { data: scores }, { data: awards }, { data: submissions }] =
    await Promise.all([
      supabase.from("contestants").select("id, name, phone, email, grade, number").eq("category_id", categoryId).order("display_order"),
      supabase.from("scoring_criteria").select("id, name, max_score").eq("category_id", categoryId).order("display_order"),
      supabase.from("scores").select("judge_id, contestant_id, criterion_id, score").in(
        "contestant_id",
        (await supabase.from("contestants").select("id").eq("category_id", categoryId)).data?.map((c) => c.id) ?? []
      ),
      supabase.from("award_settings").select("*").eq("category_id", categoryId).order("display_order"),
      supabase.from("judge_submissions").select("judge_id").eq("category_id", categoryId),
    ]);

  if (!contestants || !criteria || !scores) {
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }

  // 배정된 심사위원 전체 조회
  const { data: assignments } = await supabase
    .from("judge_assignments")
    .select("user_id")
    .eq("category_id", categoryId)
    .eq("commission_only", false);

  const assignedIds = (assignments ?? []).map((a) => a.user_id);
  const submittedIds = new Set((submissions ?? []).map((s) => s.judge_id));

  const { data: allJudgeUsers } = assignedIds.length > 0
    ? await supabase.from("users").select("id, name").in("id", assignedIds)
    : { data: [] };

  const submittedJudges = (allJudgeUsers ?? []).filter((u) => submittedIds.has(u.id));
  const pendingJudges = (allJudgeUsers ?? []).filter((u) => !submittedIds.has(u.id));

  // 선수별 × 항목별 평균 점수 계산
  const results = contestants.map((contestant) => {
    const contestantScores = scores.filter((s) => s.contestant_id === contestant.id);

    const criteriaScores = (criteria ?? []).map((criterion) => {
      const criterionScores = contestantScores
        .filter((s) => s.criterion_id === criterion.id)
        .map((s) => ({ judge_id: s.judge_id, score: s.score }));

      const avg =
        criterionScores.length > 0
          ? criterionScores.reduce((a, b) => a + b.score, 0) / criterionScores.length
          : null;

      return {
        criterion_id: criterion.id,
        criterion_name: criterion.name,
        max_score: criterion.max_score,
        avg,
        judge_count: criterionScores.length,
        judge_scores: criterionScores,
      };
    });

    const totalAvg = criteriaScores.every((c) => c.avg !== null)
      ? criteriaScores.reduce((sum, c) => sum + (c.avg ?? 0), 0)
      : null;

    return { ...contestant, criteria_scores: criteriaScores, total: totalAvg };
  });

  // 총점 기준 정렬
  results.sort((a, b) => (b.total ?? -1) - (a.total ?? -1));

  // 시상 배분
  const ranked = results.map((r, idx) => {
    if (r.total === null) return { ...r, rank: null, award: null };
    const rank = idx + 1;
    let award: string | null = null;
    let awardCursor = 0;
    for (const aw of awards ?? []) {
      const cnt = aw.count ?? 0;
      if (rank > awardCursor && rank <= awardCursor + cnt) { award = aw.award_name; break; }
      awardCursor += cnt;
    }
    return { ...r, rank, award };
  });

  const submittedJudgeCount = submissions?.length ?? 0;

  return NextResponse.json({
    results: ranked,
    criteria: criteria ?? [],
    awards: awards ?? [],
    submitted_judge_count: submittedJudgeCount,
    judges: submittedJudges,
    pending_judges: pendingJudges,
  });
}
