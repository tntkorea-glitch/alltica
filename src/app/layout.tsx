import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import FloatingContact from "@/components/FloatingContact";
import { getCurrentTheme } from "@/lib/theme";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alltica.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Alltica | 모든 신청, 한 곳에서",
    template: "%s | Alltica",
  },
  description:
    "세미나 교육 신청, 제품 구매 문의, 인재 모집, 대리점/파트너 신청, 일반 문의까지 — Alltica 한 곳에서 모든 신청을 간편하게.",
  keywords: ["Alltica", "알티카", "세미나 신청", "인스타 자동화", "postica", "뷰티 교육"],
  openGraph: {
    title: "Alltica | 모든 신청, 한 곳에서",
    description:
      "세미나 교육 · 제품 구매 · 인재 모집 · 파트너 신청을 Alltica 한 곳에서 간편하게.",
    url: SITE_URL,
    siteName: "Alltica",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alltica | 모든 신청, 한 곳에서",
    description: "세미나 · 제품 · 인재 · 파트너 신청을 한 곳에서",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getCurrentTheme();
  return (
    <html
      lang="ko"
      data-theme={theme}
      className="h-full antialiased scroll-smooth"
    >
      <head>
        <Script src="/inapp-guard.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-full flex flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-brand-deep text-white/50 px-4 sm:px-6 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/10">
              <div>
                <div className="text-lg font-extrabold text-white mb-1">Alltica</div>
                <p className="text-sm text-white/40">모든 신청, 한 곳에서</p>
              </div>
              <div className="flex flex-col sm:items-end gap-1 text-sm">
                <a href="tel:010-8842-5659" className="hover:text-white/80 transition-colors">
                  010-8842-5659
                </a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
              <p>&copy; 2026 Alltica. All rights reserved.</p>
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
