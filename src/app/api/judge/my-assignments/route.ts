import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getJudgeContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const supabase = getSupabaseAdmin();

  const { data: assignments, error } = await supabase
    .from("judge_assignments")
    .select("id, category_id, category:categories(id, name, major_category, competition_id, competitions(id, title))")
    .eq("user_id", ctx.userId)
    .eq("commission_only", false)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categoryIds = (assignments ?? []).map((a) => a.category_id);

  // 선수가 있는 카테고리만 필터링
  const { data: contestantRows } = await supabase
    .from("contestants")
    .select("category_id")
    .in("category_id", categoryIds.length > 0 ? categoryIds : ["__none__"]);

  const catsWithContestants = new Set((contestantRows ?? []).map((r) => r.category_id));
  const filteredAssignments = (assignments ?? []).filter((a) => catsWithContestants.has(a.category_id));

  const { data: submittedRows } = await supabase
    .from("judge_submissions")
    .select("category_id")
    .eq("judge_id", ctx.userId)
    .in("category_id", categoryIds.length > 0 ? categoryIds : ["__none__"]);

  const submitted: Record<string, boolean> = {};
  for (const row of submittedRows ?? []) {
    submitted[row.category_id] = true;
  }

  return NextResponse.json({ assignments: filteredAssignments, submitted, isAdmin: ctx.isAdmin });
}
