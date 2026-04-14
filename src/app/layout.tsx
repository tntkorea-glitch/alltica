import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import FloatingContact from "@/components/FloatingContact";

export const metadata: Metadata = {
  title: "통합 신청센터 | 모든 신청, 한 곳에서",
  description:
    "세미나 교육 신청, 제품 구매 문의, 인력 모집, 대리점/파트너 신청, 일반 문의까지 — 하나의 사이트에서 모든 신청을 관리하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased scroll-smooth"
    >
      <head>
        <Script src="/inapp-guard.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-full flex flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#0f1b2d] text-white/50 px-4 sm:px-6 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/10">
              <div>
                <div className="text-lg font-extrabold text-white mb-1">통합 신청센터</div>
                <p className="text-sm text-white/40">모든 신청, 한 곳에서</p>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-sm">
                <a href="tel:010-8842-5659" className="hover:text-white/80 transition-colors">
                  010-8842-5659
                </a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
              <p>&copy; 2026 통합 신청센터. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span>개인정보처리방침</span>
                <span>이용약관</span>
              </div>
            </div>
          </div>
        </footer>
        <FloatingContact />
      </body>
    </html>
  );
}
