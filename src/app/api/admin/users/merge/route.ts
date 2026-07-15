import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-session";

export const runtime = "nodejs";

// POST /api/admin/users/merge
// body: { primary_id: string, secondary_ids: string[] }
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { primary_id?: string; secondary_ids?: string[] };
  const { primary_id, secondary_ids } = body;

  if (!primary_id || !Array.isArray(secondary_ids) || secondary_ids.length === 0) {
    return NextResponse.json({ error: "primary_id 와 secondary_ids 가 필요합니다." }, { status: 400 });
  }
  if (secondary_ids.includes(primary_id)) {
    return NextResponse.json({ error: "primary_id 가 secondary_ids 에 포함될 수 없습니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("merge_users", {
    p_primary_id: primary_id,
    p_secondary_ids: secondary_ids,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
