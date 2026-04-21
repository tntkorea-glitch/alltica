import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeminarBySlug, seminars } from "@/lib/seminars";
import SeminarApplyForm from "@/components/SeminarApplyForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return seminars.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const seminar = getSeminarBySlug(slug);
  if (!seminar) return { title: "페이지를 찾을 수 없습니다" };
  return {
    title: `${seminar.title} 신청 | Alltica`,
    description: `${seminar.title} 참가 신청 페이지`,
  };
}

export default async function SeminarApplyPage({ params }: PageProps) {
  const { slug } = await params;
  const seminar = getSeminarBySlug(slug);
  if (!seminar) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="relative z-10 max-w-2xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link
            href={`/seminars/${seminar.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            세미나 상세로
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">세미나 신청</h1>
          <p className="text-blue-100/70 text-sm mt-2">
            명함을 올리시면 정보가 자동으로 입력됩니다. 명함이 없으시면 아래 항목을 직접 입력해주세요.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
          <SeminarApplyForm seminar={seminar} />
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다
        </p>
      </div>
    </div>
  );
}
