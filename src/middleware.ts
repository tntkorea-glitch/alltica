import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// 로그인 없이 접근 가능한 경로 (프리픽스 매칭)
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/profile/complete",
  "/profile/complete",
  "/_next",
  "/contests",
  "/seminars",
  "/forms",
  "/favicon",
  "/inapp-guard",
  "/public",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로 및 정적 파일 제외
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (/\.(png|jpg|jpeg|svg|ico|webp|gif|woff2?)$/.test(pathname)) return NextResponse.next();

  // JWT 직접 읽기 (edge-compatible, 콜백 없이 디코드만)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  // 로그인됐지만 phone 없는 사용자 → 프로필 완성 페이지로
  if (token && !token.phone) {
    const url = req.nextUrl.clone();
    url.pathname = "/profile/complete";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // _next/static, _next/image, api/auth 는 매처에서 아예 제외
  matcher: ["/((?!_next/static|_next/image|api/auth).*)"],
};
