import Image from "next/image";
import Link from "next/link";
import { CONTESTS, Contest, ContestStatus } from "@/lib/contests";

export const metadata = {
  title: "대회 신청 | Alltica",
  description: "Alltica에서 주최·후원하는 뷰티 대회 및 공모전에 참가 신청하세요.",
};

const STATUS_STYLE: Record<ContestStatus, { label: string; tone: string }> = {
  모집중: { label: "모집 중", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  마감임박: { label: "마감 임박", tone: "bg-red-50 text-red-600 border-red-200" },
  마감: { label: "마감", tone: "bg-gray-100 text-gray-500 border-gray-200" },
  예정: { label: "오픈 예정", tone: "bg-amber-50 text-amber-700 border-amber-200" },
};

function FeaturedContestCard({ contest }: { contest: Contest }) {
  const st = STATUS_STYLE[contest.status];
  const isActive = contest.status === "모집중" || contest.status === "마감임박";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* 포스터 이미지 */}
        {contest.image && (
          <div className="lg:w-56 xl:w-64 shrink-0">
            <div className="relative h-72 lg:h-full min-h-[260px]">
              <Image
                src={contest.image}
                alt={contest.title}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 256px"
              />
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col">
          {/* 상단 배지 + 태그 */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${st.tone}`}>
              {st.label}
            </span>
            <div className="flex gap-1 flex-wrap">
              {contest.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <h3 className="text-xl font-extrabold text-gray-900 leading-snug mb-0.5">{contest.title}</h3>
          {contest.titleEn && (
            <p className="text-xs text-gray-400 font-medium tracking-wide mb-2">{contest.titleEn}</p>
          )}
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">{contest.subtitle}</p>

          {/* 기본 정보 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm mb-4">
            <InfoRow label="대회일시" value={contest.dateDisplay} />
            <InfoRow label="접수마감" value={contest.applicationDeadline} bold />
            <InfoRow label="장소" value={contest.location} />
            <InfoRow label="주최" value={contest.organizer} />
            {contest.eligible && <InfoRow label="출품대상" value={contest.eligible} />}
            {contest.fee && <InfoRow label="참가비" value={contest.fee} />}
          </div>

          {/* 일정 */}
          {contest.schedule && contest.schedule.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2">진행 일정</p>
              <div className="space-y-1">
                {contest.schedule.map((s) => (
                  <div key={s.label} className="flex gap-2 text-xs">
                    <span className="text-gray-400 shrink-0 w-28">{s.label}</span>
                    <span className="text-gray-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 하단 시상 + 문의 + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-gray-100 mt-auto">
            <div className="space-y-1">
              <div>
                <span className="text-xs text-gray-400">시상</span>
                <p className="text-sm font-bold text-brand">{contest.prize}</p>
              </div>
              {contest.contact && (
                <div>
                  <span className="text-xs text-gray-400">신청문의</span>
                  <p className="text-xs text-gray-600">{contest.contact}</p>
                </div>
              )}
            </div>
            {isActive ? (
              <Link
                href={contest.applyUrl}
                className="inline-flex items-center gap-1.5 bg-brand text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-brand-deep transition-colors shrink-0"
              >
                신청하기 →
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-400">오픈 예정</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-16 shrink-0">{label}</span>
      <span className={`text-gray-700 ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

function ContestCard({ contest }: { contest: Contest }) {
  const st = STATUS_STYLE[contest.status];
  const isActive = contest.status === "모집중" || contest.status === "마감임박";

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${!isActive ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${st.tone}`}>
          {st.label}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {contest.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">{contest.title}</h3>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{contest.subtitle}</p>

      <div className="space-y-1.5 text-sm text-gray-600 border-t border-gray-100 pt-4">
        <div className="flex gap-2">
          <span className="text-gray-400 w-16 shrink-0">대회일시</span>
          <span className="text-gray-700">{contest.dateDisplay}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-16 shrink-0">접수마감</span>
          <span className="text-gray-700 font-medium">{contest.applicationDeadline}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-16 shrink-0">장소</span>
          <span className="text-gray-700">{contest.location}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-16 shrink-0">주최</span>
          <span className="text-gray-700">{contest.organizer}</span>
        </div>
      </div>

      <div className="flex items-end justify-between mt-5 pt-4 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">시상</div>
          <div className="text-sm font-bold text-brand">{contest.prize}</div>
        </div>
        {isActive ? (
          <Link href={contest.applyUrl} className="text-sm font-semibold text-brand hover:translate-x-1 transition-transform inline-block">
            신청하기 →
          </Link>
        ) : (
          <span className="text-sm font-semibold text-gray-400">오픈 예정</span>
        )}
      </div>
    </div>
  );
}

function renderCard(c: Contest) {
  return c.image
    ? <FeaturedContestCard key={c.id} contest={c} />
    : <ContestCard key={c.id} contest={c} />;
}

export default function ContestsPage() {
  const active = CONTESTS.filter((c) => c.status === "모집중" || c.status === "마감임박");
  const upcoming = CONTESTS.filter((c) => c.status === "예정");
  const closed = CONTESTS.filter((c) => c.status === "마감");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">🏆</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">대회 · 공모전 신청</h1>
          </div>
          <p className="text-blue-100/70 text-sm sm:text-base max-w-2xl">
            Alltica가 주최·후원하는 뷰티 기술 경연대회와 창업 공모전에 참가하세요.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-500">모집중 {active.length}개</p>
          </div>
          <div className="p-6 sm:p-8 space-y-5">
            {active.length === 0 ? (
              <p className="text-center text-gray-500 py-12">현재 모집 중인 대회가 없습니다.</p>
            ) : (
              active.map((c) => renderCard(c))
            )}
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold text-gray-500 mb-4 px-1">오픈 예정 {upcoming.length}개</h2>
            <div className="space-y-5 opacity-75">
              {upcoming.map((c) => renderCard(c))}
            </div>
          </div>
        )}

        {closed.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold text-gray-500 mb-4 px-1">일정종료 {closed.length}개</h2>
            <div className="space-y-5 opacity-50">
              {closed.map((c) => renderCard(c))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
