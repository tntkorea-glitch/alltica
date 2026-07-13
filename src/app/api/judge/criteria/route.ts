import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category_id");
  if (!categoryId) return NextResponse.json({ error: "category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("scoring_criteria")
    .select("*")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { category_id, name, max_score, display_order } = await request.json();
  if (!category_id || !name) return NextResponse.json({ error: "category_id, name 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("scoring_criteria")
    .insert({ category_id, name, max_score: max_score ?? 100, display_order: display_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("scoring_criteria").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
