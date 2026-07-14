import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";
import { getCriteriaForCategory } from "@/lib/judge-criteria-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { competition_id, competition_type } = await request.json();
  if (!competition_id || !competition_type) {
    return NextResponse.json({ error: "competition_id, competition_type 필수" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id, name")
    .eq("competition_id", competition_id)
    .order("display_order", { ascending: true });

  if (catErr || !cats) return NextResponse.json({ error: "종목 조회 실패" }, { status: 500 });

  let seeded = 0;
  let skipped = 0;
  const skippedNames: string[] = [];

  for (const cat of cats) {
    const criteria = getCriteriaForCategory(cat.name, competition_type as "대면" | "출품");
    if (criteria.length === 0) { skipped++; skippedNames.push(cat.name); continue; }

    await supabase.from("scoring_criteria").delete().eq("category_id", cat.id);

    const rows = criteria.map((c, i) => ({
      category_id: cat.id,
      name: c.name,
      max_score: c.max,
      display_order: i,
    }));

    const { error } = await supabase.from("scoring_criteria").insert(rows);
    if (!error) seeded++;
    else skipped++;
  }

  return NextResponse.json({ ok: true, seeded, skipped, skippedNames, total: cats.length });
}
