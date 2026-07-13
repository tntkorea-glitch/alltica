import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ctx = await getJudgeContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { category_id } = await request.json();
  if (!category_id) return NextResponse.json({ error: "category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // 이미 제출했는지 확인
  const { data: existing } = await supabase
    .from("judge_submissions")
    .select("id")
    .eq("judge_id", ctx.userId)
    .eq("category_id", category_id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "이미 제출 완료된 채점입니다" }, { status: 409 });

  const { data, error } = await supabase
    .from("judge_submissions")
    .insert({ judge_id: ctx.userId, category_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE: 관리자 전용 잠금 해제
export async function DELETE(request: NextRequest) {
  const ctx = await getJudgeContext();
  if (!ctx?.isAdmin) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { judge_id, category_id } = await request.json();
  if (!judge_id || !category_id) return NextResponse.json({ error: "judge_id, category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("judge_submissions")
    .delete()
    .eq("judge_id", judge_id)
    .eq("category_id", category_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
