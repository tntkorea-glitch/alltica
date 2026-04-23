"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between">
        <Link
          href="/"
          className={`text-lg sm:text-xl font-extrabold tracking-tight transition-colors ${
            scrolled ? "text-brand" : "text-white"
          }`}
        >
          Alltica
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: "/", label: "홈" },
            { href: "/seminars", label: "세미나 신청" },
            { href: "/forms/product", label: "제품 문의" },
            { href: "/forms/recruit", label: "인재 모집" },
            { href: "/forms/partner", label: "파트너 신청" },
            { href: "/forms/inquiry", label: "일반 문의" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                scrolled
                  ? "text-gray-600 hover:text-brand hover:bg-gray-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Session + CTA + admin */}
        <div className="hidden lg:flex items-center gap-3">
          {status === "authenticated" && session?.user ? (
            <div className="flex items-center gap-3">
              {(session.user.role === "instructor" || session.user.role === "admin") && (
                <Link
                  href="/teacher"
                  className={`text-sm font-semibold transition-colors ${
                    scrolled ? "text-brand hover:text-brand-hover" : "text-white hover:text-white/80"
                  }`}
                >
                  🎓 강사
                </Link>
              )}
              <span
                className={`text-sm font-medium ${
                  scrolled ? "text-gray-700" : "text-white/90"
                }`}
              >
                {session.user.name ?? session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`text-xs font-medium transition-colors ${
                  scrolled ? "text-gray-400 hover:text-brand" : "text-white/60 hover:text-white"
                }`}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-gray-600 hover:text-brand" : "text-white/80 hover:text-white"
              }`}
            >
              로그인
            </Link>
          )}
          <Link
            href="/admin"
            className={`text-xs font-medium transition-colors ${
              scrolled ? "text-gray-400 hover:text-brand" : "text-white/50 hover:text-white/80"
            }`}
            title="관리자"
          >
            관리자
          </Link>
          <Link
            href="/forms/inquiry"
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              scrolled
                ? "bg-brand text-white hover:bg-brand-hover shadow-md shadow-brand/20"
                : "bg-white text-brand hover:bg-white/90 shadow-md shadow-black/10"
            }`}
          >
            문의하기
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className={`lg:hidden p-2 rounded-lg transition-colors ${
            scrolled ? "text-gray-600 hover:bg-gray-100" : "text-white hover:bg-white/10"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg px-4 py-3 flex flex-col gap-1 animate-in">
          {[
            { href: "/", label: "홈" },
            { href: "/seminars", label: "세미나 신청" },
            { href: "/forms/product", label: "제품 문의" },
            { href: "/forms/recruit", label: "인재 모집" },
            { href: "/forms/partner", label: "파트너 신청" },
            { href: "/forms/inquiry", label: "일반 문의" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:text-brand hover:bg-gray-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
            {status === "authenticated" && session?.user ? (
              <>
                <div className="px-3 py-2 text-xs text-gray-500">
                  {session.user.name ?? session.user.email}
                </div>
                {(session.user.role === "instructor" || session.user.role === "admin") && (
                  <Link
                    href="/teacher"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-brand hover:bg-gray-50 transition-colors"
                  >
                    🎓 강사 페이지
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:text-brand hover:bg-gray-50 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:text-brand hover:bg-gray-50 transition-colors"
              >
                로그인
              </Link>
            )}
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-xs font-medium text-gray-400 hover:text-brand hover:bg-gray-50 transition-colors"
            >
              관리자
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
