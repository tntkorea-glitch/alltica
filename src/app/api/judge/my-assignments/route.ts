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
    .select("id, category_id, categories(id, name, competition_id, competitions(id, title))")
    .eq("user_id", ctx.userId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categoryIds = (assignments ?? []).map((a) => a.category_id);
  const { data: submittedRows } = await supabase
    .from("judge_submissions")
    .select("category_id")
    .eq("judge_id", ctx.userId)
    .in("category_id", categoryIds.length > 0 ? categoryIds : ["__none__"]);

  const submitted: Record<string, boolean> = {};
  for (const row of submittedRows ?? []) {
    submitted[row.category_id] = true;
  }

  return NextResponse.json({ assignments, submitted });
}
