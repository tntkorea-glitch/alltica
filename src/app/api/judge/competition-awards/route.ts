import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext, getJudgeContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await getJudgeContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const competitionId = request.nextUrl.searchParams.get("competition_id");
  if (!competitionId) return NextResponse.json({ error: "competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("competition_award_settings")
    .select("*")
    .eq("competition_id", competitionId)
    .order("grade", { ascending: true, nullsFirst: true })
    .order("display_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { competition_id, grade, award_name, count, percent, per_major_category, display_order } =
    await request.json();
  if (!competition_id || !award_name)
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("competition_award_settings")
    .insert({
      competition_id,
      grade: grade ?? null,
      award_name,
      count: count ?? null,
      percent: percent ?? null,
      per_major_category: per_major_category ?? false,
      display_order: display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const allowed = ["award_name", "count", "percent", "per_major_category", "display_order", "grade"];
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("competition_award_settings")
    .update(safe)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("competition_award_settings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
