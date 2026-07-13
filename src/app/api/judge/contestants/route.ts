import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category_id");
  const competitionId = request.nextUrl.searchParams.get("competition_id");
  if (!categoryId && !competitionId) return NextResponse.json({ error: "category_id 또는 competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  if (competitionId) {
    // 대회 전체 선수: categories → contestants 조인
    const { data: cats } = await supabase.from("categories").select("id, name").eq("competition_id", competitionId);
    if (!cats || cats.length === 0) return NextResponse.json([]);

    const catIds = cats.map((c) => c.id);
    const catNameMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

    const { data, error } = await supabase
      .from("contestants")
      .select("*, contestant_files(*)")
      .in("category_id", catIds)
      .order("category_id", { ascending: true })
      .order("number", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json((data ?? []).map((c) => ({ ...c, category_name: catNameMap[c.category_id] ?? "" })));
  }

  const { data, error } = await supabase
    .from("contestants")
    .select("*, contestant_files(*)")
    .eq("category_id", categoryId!)
    .order("number", { ascending: true })
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await request.json();
  const { category_id, name, phone, email, display_order } = body;

  if (!category_id || !name) return NextResponse.json({ error: "category_id, name 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // 카테고리 내 다음 참가번호 자동 부여
  const { count } = await supabase
    .from("contestants")
    .select("*", { count: "exact", head: true })
    .eq("category_id", category_id);
  const number = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("contestants")
    .insert({ category_id, name, phone, email, display_order: display_order ?? number, number })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
