import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("competitions")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("competitions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
