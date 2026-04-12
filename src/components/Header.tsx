"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#1e3a5f] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          📋 통합 신청센터
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-blue-200 transition-colors">
            홈
          </Link>
          <Link href="/forms/seminar" className="hover:text-blue-200 transition-colors">
            세미나 신청
          </Link>
          <Link href="/forms/product" className="hover:text-blue-200 transition-colors">
            제품 문의
          </Link>
          <Link href="/forms/recruit" className="hover:text-blue-200 transition-colors">
            인력 모집
          </Link>
          <Link href="/forms/partner" className="hover:text-blue-200 transition-colors">
            파트너 신청
          </Link>
          <Link href="/forms/inquiry" className="hover:text-blue-200 transition-colors">
            일반 문의
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴 열기"
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
        <nav className="md:hidden bg-[#16304f] border-t border-white/10 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link href="/" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-200">홈</Link>
          <Link href="/forms/seminar" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-200">세미나 신청</Link>
          <Link href="/forms/product" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-200">제품 문의</Link>
          <Link href="/forms/recruit" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-200">인력 모집</Link>
          <Link href="/forms/partner" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-200">파트너 신청</Link>
          <Link href="/forms/inquiry" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-200">일반 문의</Link>
        </nav>
      )}
    </header>
  );
}
