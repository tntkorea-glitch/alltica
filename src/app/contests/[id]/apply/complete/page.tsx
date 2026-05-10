import Link from "next/link";
import { CONTESTS } from "@/lib/contests";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

const TYPE_INFO: Record<string, { label: string; icon: string; message: string }> = {
  athlete: {
    label: "선수 신청",
    icon: "🏅",
    message: "신청이 완료되었습니다. 검토 후 개별 연락드리겠습니다.",
  },
  judge: {
    label: "심사위원 신청",
    icon: "⚖️",
    message: "신청이 완료되었습니다. 심사를 거쳐 개별 안내드리겠습니다.",
  },
  committee: {
    label: "조직위 신청",
    icon: "📋",
    message: "신청이 완료되었습니다. 검토 후 개별 연락드리겠습니다.",
  },
};

export default async function ContestApplyCompletePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { type = "athlete" } = await searchParams;
  const contest = CONTESTS.find((c) => c.id === id);
  const info = TYPE_INFO[type] ?? TYPE_INFO.athlete;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="text-3xl mb-3">{info.icon}</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">{info.label} 완료!</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{info.message}</p>

          {contest && (
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <div className="text-xs text-gray-400 mb-1">신청 대회</div>
              <div className="text-sm font-bold text-gray-800">{contest.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{contest.dateDisplay}</div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/contests"
              className="w-full bg-brand text-white py-3.5 rounded-xl font-bold text-sm hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20 text-center"
            >
              다른 대회 보기
            </Link>
            <Link
              href="/"
              className="w-full bg-white text-gray-600 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors border border-gray-200 text-center"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
