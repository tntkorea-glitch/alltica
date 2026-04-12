import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import FloatingContact from "@/components/FloatingContact";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-[#1e3a5f] text-white/70 text-center text-xs py-6">
          <p>&copy; 2026 통합 신청센터. All rights reserved.</p>
          <p className="mt-1">문의: 010-8842-5659</p>
        </footer>
        <FloatingContact />
      </body>
    </html>
  );
}
