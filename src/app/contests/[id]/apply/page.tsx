import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTESTS } from "@/lib/contests";
import ContestApplyForms from "@/components/ContestApplyForms";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return CONTESTS.map((c) => ({ id: c.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const contest = CONTESTS.find((c) => c.id === id);
  if (!contest) return { title: "페이지를 찾을 수 없습니다" };
  return {
    title: `${contest.title} 신청 | Alltica`,
    description: `${contest.title} 참가 신청`,
  };
}

export default async function ContestApplyPage({ params }: Props) {
  const { id } = await params;
  const contest = CONTESTS.find((c) => c.id === id);
  if (!contest) notFound();

  const isActive = contest.status === "모집중" || contest.status === "마감임박";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link
            href="/contests"
            className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대회 목록으로
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏆</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">대회 참가 신청</h1>
          </div>
          <p className="text-blue-100/70 text-sm mt-1">
            신청 유형을 선택하고 양식을 작성해주세요.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        {isActive ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
            <ContestApplyForms contest={contest} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-lg font-bold text-gray-800 mb-2">신청 기간이 아닙니다</p>
            <p className="text-sm text-gray-500 mb-6">
              {contest.status === "예정" ? "아직 모집이 시작되지 않았습니다." : "접수가 마감되었습니다."}
            </p>
            <Link href="/contests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              다른 대회 보기 →
            </Link>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center mt-6">
          <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다
        </p>
      </div>
    </div>
  );
}
