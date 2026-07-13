import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await request.json();
  const { title, description, date_display, status, allow_contestant_upload } = body;

  if (!title) return NextResponse.json({ error: "대회명 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("competitions")
    .insert({ title, description, date_display, status: status ?? "open", allow_contestant_upload: allow_contestant_upload ?? false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
