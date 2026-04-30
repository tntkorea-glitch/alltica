import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import FloatingContact from "@/components/FloatingContact";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import { getCurrentTheme } from "@/lib/theme";
import { services } from "@/lib/services";
import { isAdminContext } from "@/lib/admin-context";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alltica.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Alltica | 통합 비즈니스 자동화 플랫폼",
    template: "%s | Alltica",
  },
  description:
    "Postica · Yutica · Netica · Datica · Liketica · Contica · Onetica · Beautica · Novtica — 9개 ~tica 비즈니스 자동화 솔루션을 Alltica 한 곳에서 통합 관리.",
  keywords: [
    "Alltica",
    "알티카",
    "Postica",
    "Yutica",
    "Netica",
    "Datica",
    "Liketica",
    "Contica",
    "Onetica",
    "Beautica",
    "Novtica",
    "인스타 자동화",
    "유튜브 자동화",
    "블로그 자동화",
    "데이터 분석",
    "비즈니스 자동화",
    "세미나 신청",
  ],
  openGraph: {
    title: "Alltica | 통합 비즈니스 자동화 플랫폼",
    description:
      "9개 ~tica 비즈니스 솔루션을 Alltica 한 곳에서. SNS 자동화 · 데이터 분석 · 메시징 · 비즈니스 운영.",
    url: SITE_URL,
    siteName: "Alltica",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alltica | 통합 비즈니스 자동화 플랫폼",
    description: "9개 ~tica 비즈니스 솔루션을 Alltica 한 곳에서.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getCurrentTheme();
  const isAdmin = await isAdminContext();
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
        <AuthSessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-brand-deep text-white/60 px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10 pb-10 border-b border-white/10">
                {/* Brand */}
                <div className="lg:col-span-1">
                  <div className="text-xl font-extrabold text-white mb-2">Alltica</div>
                  <p className="text-sm text-white/50 mb-4 leading-relaxed">
                    9개 ~tica 비즈니스 자동화
                    <br />
                    솔루션을 한 플랫폼에서
                  </p>
                  <a
                    href="tel:010-8842-5659"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    010-8842-5659
                  </a>
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-xs font-bold text-white/90 mb-4 tracking-wider">
                    SERVICES
                  </h4>
                  <ul className="space-y-2.5 text-sm">
                    {services.map((s) =>
                      s.status === "live" && isAdmin ? (
                        <li key={s.brand}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            {s.brand}
                            <span className="text-white/30 ml-1.5 text-xs">{s.title}</span>
                          </a>
                        </li>
                      ) : (
                        <li key={s.brand} className="text-white/40">
                          {s.brand}
                          <span className="text-white/20 ml-1.5 text-xs">
                            {s.title} · 준비 중
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Apply */}
                <div>
                  <h4 className="text-xs font-bold text-white/90 mb-4 tracking-wider">
                    APPLY
                  </h4>
                  <ul className="space-y-2.5 text-sm">
                    {[
                      { href: "/seminars", label: "세미나 신청" },
                      { href: "/forms/product", label: "제품 문의" },
                      { href: "/forms/recruit", label: "인재 모집" },
                      { href: "/forms/partner", label: "파트너 신청" },
                      { href: "/forms/inquiry", label: "일반 문의" },
                    ].map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="text-xs font-bold text-white/90 mb-4 tracking-wider">
                    CONTACT
                  </h4>
                  <ul className="space-y-2.5 text-sm text-white/60">
                    <li>
                      <a
                        href="tel:010-8842-5659"
                        className="hover:text-white transition-colors"
                      >
                        ☎ 010-8842-5659
                      </a>
                    </li>
                    <li>
                      <a
                        href="mailto:tntkorea@tntkorea.co.kr"
                        className="hover:text-white transition-colors break-all"
                      >
                        ✉ tntkorea@tntkorea.co.kr
                      </a>
                    </li>
                    <li className="text-white/50 leading-relaxed">
                      📍 대구 수성구 두산동
                      <br />
                      교육장 2층
                    </li>
                  </ul>
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
        </AuthSessionProvider>
      </body>
    </html>
  );
}
