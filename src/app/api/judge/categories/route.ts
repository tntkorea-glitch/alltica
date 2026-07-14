import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const competitionId = request.nextUrl.searchParams.get("competition_id");
  if (!competitionId) return NextResponse.json({ error: "competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("competition_id", competitionId)
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await request.json();
  const { competition_id, name, description, display_order, major_category } = body;

  if (!competition_id || !name) return NextResponse.json({ error: "competition_id, name 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .insert({ competition_id, name, description, display_order: display_order ?? 0, major_category: major_category ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
