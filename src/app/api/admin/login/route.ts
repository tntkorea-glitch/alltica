import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, createAdminToken } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }
    const token = await createAdminToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_MAX_AGE,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "인증 처리 중 오류" }, { status: 500 });
  }
}
