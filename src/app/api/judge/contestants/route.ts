import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category_id");
  if (!categoryId) return NextResponse.json({ error: "category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contestants")
    .select("*, contestant_files(*)")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

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
