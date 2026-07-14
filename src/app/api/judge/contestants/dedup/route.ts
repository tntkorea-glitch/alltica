import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

// POST /api/judge/contestants/dedup
// body: { competition_id: string }
// 이름+연락처+종목이 동일한 중복 선수 제거 후 번호 재정렬
export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { competition_id } = await request.json();
  if (!competition_id) return NextResponse.json({ error: "competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: cats } = await supabase.from("categories").select("id").eq("competition_id", competition_id);
  if (!cats || cats.length === 0) return NextResponse.json({ deleted: 0 });

  const catIds = cats.map((c) => c.id);

  const { data: all, error: fetchErr } = await supabase
    .from("contestants")
    .select("id, name, phone, category_id, number, display_order")
    .in("category_id", catIds)
    .order("number", { ascending: true })
    .order("display_order", { ascending: true });

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!all || all.length === 0) return NextResponse.json({ deleted: 0 });

  // 이름+연락처+종목 기준 그룹화 → 번호 가장 낮은 것만 유지
  const groups = new Map<string, typeof all>();
  for (const c of all) {
    const key = `${c.name}|${(c.phone ?? "").replace(/\D/g, "")}|${c.category_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const toDelete: string[] = [];
  const affectedCats = new Set<string>();

  for (const group of groups.values()) {
    if (group.length > 1) {
      const extras = group.slice(1);
      toDelete.push(...extras.map((c) => c.id));
      extras.forEach((c) => affectedCats.add(c.category_id));
    }
  }

  if (toDelete.length === 0) return NextResponse.json({ deleted: 0 });

  const { error: delErr } = await supabase.from("contestants").delete().in("id", toDelete);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // 영향받은 종목별 번호 재정렬
  for (const catId of affectedCats) {
    const { data: remaining } = await supabase
      .from("contestants")
      .select("id")
      .eq("category_id", catId)
      .order("number", { ascending: true })
      .order("display_order", { ascending: true });

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase.from("contestants").update({ number: i + 1, display_order: i + 1 }).eq("id", remaining[i].id);
      }
    }
  }

  return NextResponse.json({ deleted: toDelete.length });
}
