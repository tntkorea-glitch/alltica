import Link from "next/link";
import { getAllSeminars } from "@/lib/seminars";
import SeminarsView from "@/components/SeminarsView";

export const metadata = {
  title: "세미나/교육 신청 | Alltica",
  description: "Alltica에서 진행하는 세미나와 교육 과정을 신청하세요.",
};

export default async function SeminarsPage() {
  const seminars = await getAllSeminars();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">🎓</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">세미나 · 교육 신청</h1>
          </div>
          <p className="text-blue-100/70 text-sm sm:text-base max-w-2xl">
            현장에서 바로 쓰는 커리큘럼으로 구성된 Alltica의 세미나와 교육 과정입니다. 명함을 업로드하시면 신청이 더 간편해집니다.
          </p>
        </div>
      </div>

      <SeminarsView seminars={seminars} />
    </div>
  );
}
