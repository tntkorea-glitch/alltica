"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
            scrolled ? "text-[#1e3a5f]" : "text-white"
          }`}
        >
          통합 신청센터
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: "/", label: "홈" },
            { href: "/forms/seminar", label: "세미나 신청" },
            { href: "/forms/product", label: "제품 문의" },
            { href: "/forms/recruit", label: "인력 모집" },
            { href: "/forms/partner", label: "파트너 신청" },
            { href: "/forms/inquiry", label: "일반 문의" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                scrolled
                  ? "text-gray-600 hover:text-[#1e3a5f] hover:bg-gray-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA button */}
        <div className="hidden lg:block">
          <Link
            href="/forms/inquiry"
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              scrolled
                ? "bg-[#1e3a5f] text-white hover:bg-[#16304f] shadow-md shadow-[#1e3a5f]/20"
                : "bg-white text-[#1e3a5f] hover:bg-white/90 shadow-md shadow-black/10"
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
            { href: "/forms/seminar", label: "세미나 신청" },
            { href: "/forms/product", label: "제품 문의" },
            { href: "/forms/recruit", label: "인력 모집" },
            { href: "/forms/partner", label: "파트너 신청" },
            { href: "/forms/inquiry", label: "일반 문의" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg text-sm font-medium text-gray-700 hover:text-[#1e3a5f] hover:bg-gray-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
