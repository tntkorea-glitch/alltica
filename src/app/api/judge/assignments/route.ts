import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

async function fetchAssignmentsWithUsers(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  filter: { competition_id?: string; category_id?: string },
  catMeta?: Map<string, { name: string; major_category?: string }>
) {
  let query = supabase
    .from("judge_assignments")
    .select("id, user_id, category_id, title, judge_name, created_at")
    .order("created_at", { ascending: true });

  if (filter.competition_id && catMeta) {
    const catIds = [...catMeta.keys()];
    if (catIds.length === 0) return [];
    query = query.in("category_id", catIds);
  } else if (filter.category_id) {
    query = query.eq("category_id", filter.category_id);
  }

  const { data: assignments, error } = await query;
  if (error) throw new Error(error.message);
  if (!assignments || assignments.length === 0) return [];

  // 사용자 정보 별도 조회 (join 대신)
  const userIds = [...new Set(assignments.map((a) => a.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, email, name, image")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return assignments.map((a) => ({
    ...a,
    users: userMap.get(a.user_id) ?? null,
    ...(catMeta ? { category_name: catMeta.get(a.category_id)?.name, major_category: catMeta.get(a.category_id)?.major_category } : {}),
  }));
}

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category_id");
  const competitionId = request.nextUrl.searchParams.get("competition_id");

  const supabase = getSupabaseAdmin();

  try {
    if (competitionId) {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name, major_category")
        .eq("competition_id", competitionId);

      const catMeta = new Map((cats ?? []).map((c) => [c.id, { name: c.name, major_category: c.major_category }]));
      const result = await fetchAssignmentsWithUsers(supabase, { competition_id: competitionId }, catMeta);
      return NextResponse.json(result);
    }

    if (!categoryId) return NextResponse.json({ error: "category_id 또는 competition_id 필수" }, { status: 400 });

    const result = await fetchAssignmentsWithUsers(supabase, { category_id: categoryId });
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
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

export async function PATCH(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // 실제 이메일 연결 (ibc.local 플레이스홀더 → 구글 계정)
  if (body.action === "link-email") {
    const { user_id, new_email } = body as { user_id: string; new_email: string };
    const { data: existing } = await supabase.from("users").select("id").eq("email", new_email).maybeSingle();
    if (existing) return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 409 });
    const { error } = await supabase.from("users").update({ email: new_email }).eq("id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 위촉/심사배정 플래그 일괄 업데이트 (한 사람의 모든 종목 배정에 적용)
  const { user_id, competition_id, commissioned, commission_only } = body as {
    user_id: string; competition_id: string; commissioned?: boolean; commission_only?: boolean;
  };
  const { data: cats } = await supabase.from("categories").select("id").eq("competition_id", competition_id);
  const catIds = (cats ?? []).map((c: { id: string }) => c.id);
  if (catIds.length === 0) return NextResponse.json({ ok: true });

  const updates: Record<string, boolean> = {};
  if (commissioned !== undefined) updates.commissioned = commissioned;
  if (commission_only !== undefined) updates.commission_only = commission_only;

  const { error } = await supabase.from("judge_assignments")
    .update(updates).eq("user_id", user_id).in("category_id", catIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
