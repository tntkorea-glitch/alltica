import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeminarBySlug, seminars, formatPrice } from "@/lib/seminars";

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
    title: `${seminar.title} | Alltica 세미나`,
    description: seminar.summary,
  };
}

export default async function SeminarDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const seminar = getSeminarBySlug(slug);

  if (!seminar) notFound();

  const isOpen = seminar.status === "open";
  const isUpcoming = seminar.status === "upcoming";
  const canApply = isOpen || isUpcoming;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link
            href="/seminars"
            className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            세미나 목록
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {seminar.tags.map((tag) => (
              <span key={tag} className="text-xs text-blue-100/80 bg-white/10 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
            {seminar.title}
          </h1>
          {seminar.subtitle && (
            <p className="text-blue-100/80 text-base sm:text-lg">{seminar.subtitle}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 space-y-8">
          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="일시" value={seminar.dateDisplay} icon="📅" />
            <InfoRow label="장소" value={seminar.location} icon="📍" />
            <InfoRow label="강사" value={seminar.instructor} icon="👤" />
            <InfoRow
              label="참가비"
              value={formatPrice(seminar.price)}
              icon="💳"
              emphasize
            />
            {seminar.capacity && (
              <InfoRow label="정원" value={`${seminar.capacity}명`} icon="👥" />
            )}
          </div>

          {/* Description */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">세미나 소개</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {seminar.description}
            </p>
          </section>

          {/* Curriculum */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">커리큘럼</h2>
            <ol className="space-y-2">
              {seminar.curriculum.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 text-sm leading-relaxed pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Target */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">이런 분께 추천드려요</h2>
            <ul className="space-y-1.5">
              {seminar.target.map((item, idx) => (
                <li key={idx} className="flex gap-2 items-start text-gray-700 text-sm">
                  <span className="text-brand mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Apply CTA */}
          <div className="pt-4 border-t border-gray-100">
            {canApply ? (
              <Link
                href={`/seminars/${seminar.slug}/apply`}
                className="block w-full text-center bg-brand text-white py-4 rounded-xl font-bold text-base hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20"
              >
                {isOpen ? "지금 신청하기" : "사전 신청 접수"}
              </Link>
            ) : (
              <button
                disabled
                className="block w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-bold text-base cursor-not-allowed"
              >
                {seminar.status === "closed" ? "신청이 마감되었습니다" : "종료된 세미나입니다"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  emphasize,
}: {
  label: string;
  value: string;
  icon: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex gap-3 items-start bg-gray-50 rounded-xl p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className={`text-sm ${emphasize ? "text-brand font-extrabold text-base" : "text-gray-800 font-medium"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
