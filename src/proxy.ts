import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";
import { auth } from "@/lib/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Judge admin gate (/judge/admin, /judge/result — admin/subadmin only)
  if (pathname.startsWith("/judge/admin") || pathname.startsWith("/judge/result")) {
    const session = await auth();
    const role = session?.user?.role;
    if (role === "admin" || role === "subadmin") return NextResponse.next();
    return NextResponse.redirect(new URL("/judge", request.url));
  }

  // /judge paths: skip phone gate (judges may not have phone registered)
  if (pathname.startsWith("/judge")) return NextResponse.next();

  // Admin gate
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (await verifyAdminToken(token)) return NextResponse.next();

    const session = await auth();
    const role = session?.user?.role;
    if (role === "admin" || role === "subadmin") return NextResponse.next();

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Phone gate: /profile/complete itself must pass through (infinite loop prevention)
  if (pathname.startsWith("/profile/complete")) return NextResponse.next();

  // Redirect logged-in users without phone to profile completion
  const session = await auth();
  if (session?.user && !session.user.phone) {
    const url = new URL("/profile/complete", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
