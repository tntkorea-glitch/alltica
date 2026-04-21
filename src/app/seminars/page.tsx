import Link from "next/link";
import { seminars } from "@/lib/seminars";
import SeminarCard from "@/components/SeminarCard";

export const metadata = {
  title: "세미나/교육 신청 | Alltica",
  description: "Alltica에서 진행하는 세미나와 교육 과정을 신청하세요.",
};

export default function SeminarsPage() {
  const openOrUpcoming = seminars.filter(
    (s) => s.status === "open" || s.status === "upcoming"
  );
  const closed = seminars.filter(
    (s) => s.status === "closed" || s.status === "completed"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b2d] via-[#1e3a5f] to-[#2a5080]" />
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

      {/* Open seminars */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
          {openOrUpcoming.length === 0 ? (
            <p className="text-center text-gray-500 py-12">현재 모집 중인 세미나가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {openOrUpcoming.map((s) => (
                <SeminarCard key={s.slug} seminar={s} />
              ))}
            </div>
          )}
        </div>

        {closed.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold text-gray-500 mb-4 px-1">지난 세미나</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-60">
              {closed.map((s) => (
                <SeminarCard key={s.slug} seminar={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
