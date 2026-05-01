import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminRequest, verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-session";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const ROLES = ["user", "instructor", "subadmin", "admin"] as const;
type Role = (typeof ROLES)[number];

// "주체 관리자(admin)"인지 확인: 쿠키(password)로 들어왔거나, 세션 role=admin 이어야 함.
// subadmin 이 다른 사용자를 admin 으로 승격시키거나, 기존 admin 을 강등시키는 걸 막기 위함.
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
    phone?: string;
    use_own_solapi?: boolean;
    solapi_api_key?: string;
    solapi_api_secret?: string;
    solapi_sender?: string;
  };

  const patch: {
    role?: Role;
    phone?: string | null;
    use_own_solapi?: boolean;
    solapi_api_key?: string | null;
    solapi_api_secret?: string | null;
    solapi_sender?: string | null;
  } = {};
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role as Role)) {
      return NextResponse.json({ error: "잘못된 role" }, { status: 400 });
    }
    patch.role = body.role as Role;
  }
  if (body.phone !== undefined) {
    patch.phone = body.phone?.trim() || null;
  }
  if (body.use_own_solapi !== undefined) patch.use_own_solapi = body.use_own_solapi;
  if (body.solapi_api_key !== undefined) patch.solapi_api_key = body.solapi_api_key?.trim() || null;
  if (body.solapi_api_secret !== undefined) patch.solapi_api_secret = body.solapi_api_secret?.trim() || null;
  if (body.solapi_sender !== undefined) patch.solapi_sender = body.solapi_sender?.trim() || null;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 값이 없습니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 서브관리자 권한 제약: admin 으로 올리거나 admin 을 강등/수정하는 건 full admin 만
  if (!fullAdmin) {
    if (patch.role === "admin") {
      return NextResponse.json(
        { error: "관리자 승격은 최고관리자만 가능합니다." },
        { status: 403 },
      );
    }
    const { data: target } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .maybeSingle();
    if (target?.role === "admin") {
      return NextResponse.json(
        { error: "관리자 계정은 최고관리자만 수정할 수 있습니다." },
        { status: 403 },
      );
    }
  }

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
