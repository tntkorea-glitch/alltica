import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeminarBySlug, getAllSeminars, formatPrice } from "@/lib/seminars";
import { getServiceKeyFromSlug, getServiceContent, ServiceContent } from "@/lib/seminar-content";
import StickyApplyCTA from "@/components/StickyApplyCTA";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const seminars = await getAllSeminars();
  return seminars.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) return { title: "페이지를 찾을 수 없습니다" };
  return {
    title: `${seminar.title} | Alltica 세미나`,
    description: seminar.summary,
  };
}

export default async function SeminarDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const seminar = await getSeminarBySlug(slug);
  if (!seminar) notFound();

  const isOpen = seminar.status === "open";
  const isUpcoming = seminar.status === "upcoming";
  const canApply = isOpen || isUpcoming;

  const serviceKey = getServiceKeyFromSlug(slug);
  const service = serviceKey ? getServiceContent(serviceKey) : null;

  const applyHref = `/seminars/${seminar.slug}/apply`;
  const applyLabel = isOpen ? "지금 신청하기 →" : "사전 신청 접수";
  const disabledLabel =
    seminar.status === "closed" ? "신청이 마감되었습니다" : "종료된 세미나입니다";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6">
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
            <StatusBadge status={seminar.status} />
            {seminar.tags.map((tag) => (
              <span key={tag} className="text-xs text-blue-100/80 bg-white/10 px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
            {seminar.title}
          </h1>
          {seminar.subtitle && (
            <p className="text-blue-100/80 text-base sm:text-lg mb-2">{seminar.subtitle}</p>
          )}
          {seminar.summary && (
            <p className="text-blue-100/60 text-sm mb-6 leading-relaxed">{seminar.summary}</p>
          )}

          {/* Hero CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {canApply ? (
              <Link
                href={applyHref}
                className="inline-flex items-center justify-center bg-white text-brand font-extrabold px-8 py-4 rounded-2xl text-base hover:bg-blue-50 transition-colors shadow-xl"
              >
                {applyLabel}
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center bg-white/20 text-white/60 font-bold px-8 py-4 rounded-2xl text-base cursor-not-allowed">
                {disabledLabel}
              </span>
            )}
            <a
              href="#curriculum"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-4 rounded-2xl text-sm transition-colors"
            >
              커리큘럼 보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ── QUICK INFO BAR ───────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickInfoItem icon="📅" label="일시" value={seminar.dateDisplay} />
            <QuickInfoItem icon="📍" label="장소" value={seminar.location} />
            <QuickInfoItem icon="👤" label="강사" value={seminar.instructor} />
            <QuickInfoItem icon="💳" label="참가비" value={formatPrice(seminar.price)} emphasize />
          </div>
          {seminar.capacity && (
            <p className="text-center text-xs text-gray-400 mt-3 font-medium">
              정원 <span className="text-brand font-bold">{seminar.capacity}명</span> 한정 · 선착순 마감
            </p>
          )}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 pb-36">

        {/* WHAT YOU'LL LEARN */}
        {service && (
          <section>
            <SectionHeader
              eyebrow="WHAT YOU'LL LEARN"
              title="이 세미나에서 배울 내용"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="text-3xl mb-3">{h.icon}</div>
                  <h3 className="font-extrabold text-gray-900 mb-1.5 text-sm">{h.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SERVICE INTRO */}
        {service && <ServiceIntroSection service={service} />}

        {/* PROMO VIDEO */}
        {service && <PromoVideoSection service={service} />}

        {/* DESCRIPTION */}
        {seminar.description && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">세미나 소개</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
              {seminar.description}
            </p>
          </section>
        )}

        {/* CURRICULUM */}
        {seminar.curriculum.length > 0 && (
          <section id="curriculum" className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm scroll-mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-5">커리큘럼</h2>
            <ol className="space-y-3">
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
        )}

        {/* TARGET AUDIENCE */}
        {seminar.target.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">이런 분께 추천드려요</h2>
            <ul className="space-y-3">
              {seminar.target.map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start text-gray-700 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* BOTTOM CTA */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 shadow-sm text-center">
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">
            지금 바로 신청하세요
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {seminar.capacity
              ? `정원 ${seminar.capacity}명 한정`
              : "선착순 마감"}{" "}
            · <span className="font-bold text-brand">{formatPrice(seminar.price)}</span>
          </p>
          {canApply ? (
            <Link
              href={applyHref}
              className="block w-full bg-brand text-white py-4 rounded-2xl font-extrabold text-base hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20"
            >
              {applyLabel}
            </Link>
          ) : (
            <button
              disabled
              className="block w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-base cursor-not-allowed"
            >
              {disabledLabel}
            </button>
          )}
          {canApply && (
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              명함 사진 한 장이면 신청 정보 자동 입력 · 결제는 계좌이체
            </p>
          )}
        </section>
      </div>

      {/* ── STICKY FLOATING CTA ──────────────────────────────────── */}
      <StickyApplyCTA
        href={applyHref}
        label={applyLabel}
        disabled={!canApply}
        disabledLabel={disabledLabel}
      />
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { text: string; cls: string }> = {
    open:      { text: "모집중",   cls: "bg-emerald-500 text-white" },
    upcoming:  { text: "오픈예정", cls: "bg-blue-500 text-white" },
    closed:    { text: "마감",     cls: "bg-gray-500 text-white" },
    completed: { text: "종료",     cls: "bg-gray-400 text-white" },
  };
  const { text, cls } = cfg[status] ?? { text: status, cls: "bg-gray-500 text-white" };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{text}</span>
  );
}

function QuickInfoItem({
  icon, label, value, emphasize,
}: {
  icon: string; label: string; value: string; emphasize?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-xs text-gray-400 mb-0.5">{icon} {label}</div>
      <div className={`text-sm font-semibold leading-tight ${emphasize ? "text-brand font-extrabold" : "text-gray-800"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center mb-6">
      <p className="text-xs font-bold text-brand uppercase tracking-widest mb-1">{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{title}</h2>
    </div>
  );
}

function ServiceIntroSection({ service }: { service: ServiceContent }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
          <span className="text-xl font-black text-brand">{service.name[0]}</span>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium">이 세미나를 진행하는 솔루션</p>
          <h2 className="text-base font-extrabold text-gray-900">
            {service.name}
            <span className="text-gray-400 font-normal"> — </span>
            {service.tagline}
          </h2>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">
        {service.description}
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {service.features.map((f, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-3.5 hover:bg-brand/5 transition-colors">
            <span className="text-xl">{f.icon}</span>
            <p className="text-xs font-bold text-gray-800 mt-1.5 mb-0.5 leading-tight">{f.title}</p>
            <p className="text-xs text-gray-500 leading-tight">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Link */}
      <div className="mt-5 pt-5 border-t border-gray-100">
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand font-semibold hover:underline"
        >
          {service.name} 공식 사이트 방문
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </section>
  );
}

function PromoVideoSection({ service }: { service: ServiceContent }) {
  const isLocal = service.promoVideoUrl?.startsWith("/");
  const isYoutube = service.promoVideoUrl && !isLocal;

  return (
    <section>
      <SectionHeader eyebrow="PROMO VIDEO" title={`${service.name} 소개 영상`} />
      <div className="flex justify-center">
        {isLocal ? (
          /* 로컬 MP4 — 세로(9:16) 숏츠 스타일 */
          <div className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-xl bg-black">
            <video
              src={service.promoVideoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full"
              style={{ aspectRatio: "9/16", objectFit: "contain" }}
            />
          </div>
        ) : isYoutube ? (
          /* YouTube embed */
          <div className="relative w-full max-w-xs aspect-[9/16] rounded-2xl overflow-hidden shadow-xl">
            <iframe
              src={service.promoVideoUrl}
              title={`${service.name} 홍보 영상`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          /* 준비 중 플레이스홀더 */
          <div className="relative w-full max-w-xs aspect-[9/16] bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-center px-6">
              <p className="text-sm font-bold text-gray-700 mb-1">홍보 영상 준비 중</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {service.name}의 주요 기능과<br />
                동작 방법을 담은 영상을<br />
                곧 공개합니다
              </p>
            </div>
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand font-semibold hover:underline"
              >
                지금 바로 {service.name} 체험하기 →
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
