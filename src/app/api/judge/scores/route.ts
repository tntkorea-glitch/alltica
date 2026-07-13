import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

// GET: 내 채점 현황 (category_id 기준)
export async function GET(request: NextRequest) {
  const ctx = await getJudgeContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const categoryId = request.nextUrl.searchParams.get("category_id");
  if (!categoryId) return NextResponse.json({ error: "category_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("judge_id", ctx.userId)
    .in(
      "contestant_id",
      (await supabase.from("contestants").select("id").eq("category_id", categoryId)).data?.map((c) => c.id) ?? []
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT: 점수 upsert (잠금 여부 확인 후 저장)
export async function PUT(request: NextRequest) {
  const ctx = await getJudgeContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { contestant_id, criterion_id, score, comment, category_id } = await request.json();
  if (contestant_id == null || criterion_id == null || score == null || !category_id) {
    return NextResponse.json({ error: "contestant_id, criterion_id, score, category_id 필수" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 잠금 여부 확인
  const { data: submission } = await supabase
    .from("judge_submissions")
    .select("id")
    .eq("judge_id", ctx.userId)
    .eq("category_id", category_id)
    .maybeSingle();

  if (submission) return NextResponse.json({ error: "이미 제출 완료된 채점은 수정할 수 없습니다" }, { status: 403 });

  const { data, error } = await supabase
    .from("scores")
    .upsert(
      { judge_id: ctx.userId, contestant_id, criterion_id, score, comment },
      { onConflict: "judge_id,contestant_id,criterion_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
