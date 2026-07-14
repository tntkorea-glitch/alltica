import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const categoryIdsParam = request.nextUrl.searchParams.get("category_ids");
  if (!categoryIdsParam) return NextResponse.json([]);
  const categoryIds = categoryIdsParam.split(",").filter(Boolean);
  if (categoryIds.length === 0) return NextResponse.json([]);

  const supabase = getSupabaseAdmin();

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    supabase
      .from("judge_assignments")
      .select("user_id, category_id, judge_name, users(id, name, email)")
      .in("category_id", categoryIds)
      .eq("commission_only", false),
    supabase
      .from("judge_submissions")
      .select("judge_id, category_id, submitted_at")
      .in("category_id", categoryIds),
  ]);

  const submissionMap = new Map<string, string>();
  for (const s of submissions ?? []) {
    submissionMap.set(`${s.judge_id}:${s.category_id}`, s.submitted_at);
  }

  const judgeMap = new Map<string, { id: string; name: string; email: string; categories: { categoryId: string; submitted: boolean; submitted_at?: string }[] }>();

  for (const a of assignments ?? []) {
    const rawUser = a.users;
    const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { id: string; name: string; email: string } | null;
    if (!user) continue;
    const displayName = (a.judge_name as string | null) || user.name;
    if (!judgeMap.has(user.id)) {
      judgeMap.set(user.id, { id: user.id, name: displayName, email: user.email, categories: [] });
    }
    const submittedAt = submissionMap.get(`${user.id}:${a.category_id}`);
    judgeMap.get(user.id)!.categories.push({
      categoryId: a.category_id,
      submitted: !!submittedAt,
      submitted_at: submittedAt,
    });
  }

  return NextResponse.json(Array.from(judgeMap.values()));
}
