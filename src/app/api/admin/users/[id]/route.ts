import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-session";

export const runtime = "nodejs";

const ROLES = ["user", "instructor", "admin"] as const;
type Role = (typeof ROLES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json()) as { role?: string; phone?: string };

  const patch: { role?: Role; phone?: string | null } = {};
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role as Role)) {
      return NextResponse.json({ error: "잘못된 role" }, { status: 400 });
    }
    patch.role = body.role as Role;
  }
  if (body.phone !== undefined) {
    patch.phone = body.phone?.trim() || null;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
