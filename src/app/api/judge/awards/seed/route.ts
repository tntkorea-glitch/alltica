import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

const DEFAULT_AWARDS = [
  { award_name: "금상", count: 1 },
  { award_name: "은상", count: 1 },
  { award_name: "동상", count: 1 },
  { award_name: "장려상", count: 1 },
];

async function seedForCategory(supabase: ReturnType<typeof import("@/lib/supabase").getSupabaseAdmin>, categoryId: string) {
  await supabase.from("award_settings").delete().eq("category_id", categoryId);
  const rows = DEFAULT_AWARDS.map((a, i) => ({ category_id: categoryId, ...a, display_order: i }));
  const { error } = await supabase.from("award_settings").insert(rows);
  if (error) throw new Error(error.message);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { category_id, competition_id } = await request.json();
  if (!category_id && !competition_id) {
    return NextResponse.json({ error: "category_id 또는 competition_id 필수" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (competition_id) {
    // 대회 전체 종목에 일괄 적용
    const { data: cats, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("competition_id", competition_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!cats || cats.length === 0) return NextResponse.json({ error: "종목이 없습니다" }, { status: 404 });

    for (const cat of cats) {
      await seedForCategory(supabase, cat.id);
    }

    return NextResponse.json({ ok: true, applied_to: cats.map((c) => c.name), count: cats.length });
  }

  // 단일 종목
  await seedForCategory(supabase, category_id);
  return NextResponse.json({ ok: true, applied_to: [category_id], count: 1 });
}
