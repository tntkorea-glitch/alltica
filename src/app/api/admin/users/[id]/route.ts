import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminRequest, verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-session";
import { auth } from "@/lib/auth";
import { KBA_GRADES } from "@/lib/roles";

export const runtime = "nodejs";

const SYS_ROLES = ["user", "instructor", "subadmin", "admin"] as const;
type SysRole = (typeof SYS_ROLES)[number];

async function isFullAdmin(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (await verifyAdminToken(match?.[1])) return true;
  const session = await auth();
  return session?.user?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const fullAdmin = await isFullAdmin(request);

  const { id } = await params;
  const body = (await request.json()) as {
    role?: string;
    kba_grade?: string | null;
    phone?: string;
    use_own_solapi?: boolean;
    solapi_api_key?: string;
    solapi_api_secret?: string;
    solapi_sender?: string;
    solapi_pf_id?: string;
  };

  const patch: {
    role?: SysRole;
    kba_grade?: string | null;
    phone?: string | null;
    use_own_solapi?: boolean;
    solapi_api_key?: string | null;
    solapi_api_secret?: string | null;
    solapi_sender?: string | null;
    solapi_pf_id?: string | null;
  } = {};

  if (body.role !== undefined) {
    if (!(SYS_ROLES as readonly string[]).includes(body.role)) {
      return NextResponse.json({ error: "잘못된 role" }, { status: 400 });
    }
    patch.role = body.role as SysRole;
  }
  if (body.kba_grade !== undefined) {
    const grade = body.kba_grade;
    if (grade !== null && !(KBA_GRADES as readonly string[]).includes(grade)) {
      return NextResponse.json({ error: "잘못된 kba_grade" }, { status: 400 });
    }
    patch.kba_grade = grade || null;
  }
  if (body.phone !== undefined) patch.phone = body.phone?.trim() || null;
  if (body.use_own_solapi !== undefined) patch.use_own_solapi = body.use_own_solapi;
  if (body.solapi_api_key !== undefined) patch.solapi_api_key = body.solapi_api_key?.trim() || null;
  if (body.solapi_api_secret !== undefined) patch.solapi_api_secret = body.solapi_api_secret?.trim() || null;
  if (body.solapi_sender !== undefined) patch.solapi_sender = body.solapi_sender?.trim() || null;
  if (body.solapi_pf_id !== undefined) patch.solapi_pf_id = body.solapi_pf_id?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (!fullAdmin) {
    if (patch.role === "admin") {
      return NextResponse.json({ error: "관리자 승격은 최고관리자만 가능합니다." }, { status: 403 });
    }
    const { data: target } = await supabase.from("users").select("role").eq("id", id).maybeSingle();
    if (target?.role === "admin") {
      return NextResponse.json({ error: "관리자 계정은 최고관리자만 수정할 수 있습니다." }, { status: 403 });
    }
  }

  const { data, error } = await supabase.from("users").update(patch).eq("id", id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  if (!(await isFullAdmin(request))) {
    return NextResponse.json({ error: "최고관리자만 회원을 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: target } = await supabase.from("users").select("role").eq("id", id).maybeSingle();
  if (target?.role === "admin") {
    return NextResponse.json({ error: "관리자 계정은 삭제할 수 없습니다." }, { status: 403 });
  }

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
