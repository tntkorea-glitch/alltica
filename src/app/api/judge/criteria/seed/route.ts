import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";
import { getCriteriaForCategory } from "@/lib/judge-criteria-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { category_id, competition_type } = await request.json();
  if (!category_id || !competition_type) {
    return NextResponse.json({ error: "category_id, competition_type 필수" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: category, error: catErr } = await supabase
    .from("categories")
    .select("name")
    .eq("id", category_id)
    .single();

  if (catErr || !category) {
    return NextResponse.json({ error: "종목을 찾을 수 없습니다" }, { status: 404 });
  }

  const criteria = getCriteriaForCategory(category.name, competition_type as "대면" | "출품");
  if (criteria.length === 0) {
    return NextResponse.json({ error: `"${category.name}" 종목의 채점 기준을 찾을 수 없습니다. 종목명을 확인해주세요.` }, { status: 422 });
  }

  // 기존 항목 삭제 후 재등록
  await supabase.from("scoring_criteria").delete().eq("category_id", category_id);

  const rows = criteria.map((c, i) => ({
    category_id,
    name: c.name,
    max_score: c.max,
    display_order: i,
  }));

  const { data, error } = await supabase
    .from("scoring_criteria")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    category_name: category.name,
    competition_type,
    inserted: data?.length ?? 0,
    total: criteria.reduce((s, c) => s + c.max, 0),
  });
}
