import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";
import { CATEGORY_HIERARCHY } from "@/lib/judge-categories";

export const runtime = "nodejs";

// POST /api/judge/categories/bulk
// CATEGORY_HIERARCHY의 모든 세부종목을 대종목(major_category) 포함해서 일괄 생성
export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { competition_id } = await request.json();
  if (!competition_id) return NextResponse.json({ error: "competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // 기존 카테고리 이름 목록
  const { data: existing } = await supabase
    .from("categories")
    .select("name")
    .eq("competition_id", competition_id);
  const existingNames = new Set((existing ?? []).map((c) => c.name));

  const inserts: Array<{ competition_id: string; name: string; major_category: string; display_order: number }> = [];
  let order = existing?.length ?? 0;

  for (const group of CATEGORY_HIERARCHY) {
    for (const sub of group.subs) {
      if (!existingNames.has(sub)) {
        inserts.push({ competition_id, name: sub, major_category: group.major, display_order: order++ });
      }
    }
  }

  if (inserts.length === 0) return NextResponse.json({ added: 0, message: "추가할 종목이 없습니다 (이미 모두 등록됨)" });

  const { data, error } = await supabase.from("categories").insert(inserts).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ added: data?.length ?? 0 }, { status: 201 });
}
