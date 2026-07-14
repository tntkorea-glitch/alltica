import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category_id");
  const competitionId = request.nextUrl.searchParams.get("competition_id");

  const supabase = getSupabaseAdmin();

  // competition_id: 대회 전체 배정 목록 (단일 쿼리)
  if (competitionId) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, major_category")
      .eq("competition_id", competitionId);

    const catIds = (cats ?? []).map((c) => c.id);
    if (catIds.length === 0) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("judge_assignments")
      .select("*, users(id, email, name, image)")
      .in("category_id", catIds)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const catMap = new Map((cats ?? []).map((c) => [c.id, c]));
    return NextResponse.json(
      (data ?? []).map((a) => ({
        ...a,
        category_name: catMap.get(a.category_id)?.name,
        major_category: catMap.get(a.category_id)?.major_category,
      }))
    );
  }

  if (!categoryId) return NextResponse.json({ error: "category_id 또는 competition_id 필수" }, { status: 400 });

  const { data, error } = await supabase
    .from("judge_assignments")
    .select("*, users(id, email, name, image)")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { email, category_id } = await request.json();
  if (!email || !category_id) return NextResponse.json({ error: "email, category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  if (userErr || !user) return NextResponse.json({ error: "해당 이메일의 회원을 찾을 수 없습니다" }, { status: 404 });

  const { data, error } = await supabase
    .from("judge_assignments")
    .insert({ user_id: user.id, category_id, assigned_by: ctx.userId })
    .select("*, users(id, email, name, image)")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "이미 배정된 심사위원입니다" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("judge_assignments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
