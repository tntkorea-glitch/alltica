import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeminarBySlug, seminars, formatPrice } from "@/lib/seminars";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return seminars.map((s) => ({ slug: s.slug }));
}

export const metadata = {
  title: "신청이 완료되었습니다 | Alltica",
};

export default async function ApplyCompletePage({ params }: PageProps) {
  const { slug } = await params;
  const seminar = getSeminarBySlug(slug);
  if (!seminar) notFound();

  const bankName = process.env.BANK_NAME || "은행";
  const bankAccount = process.env.BANK_ACCOUNT_NUMBER || "(관리자에게 확인)";
  const bankHolder = process.env.BANK_ACCOUNT_NAME || "Alltica";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="relative z-10 max-w-2xl mx-auto pt-28 pb-14 px-4 sm:px-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            신청이 접수되었습니다
          </h1>
          <p className="text-blue-100/80 text-sm sm:text-base">
            입력하신 연락처로 접수 안내 문자를 발송했습니다.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 space-y-8">
          {/* Seminar info */}
          <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3">신청 내역</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <Row label="세미나" value={seminar.title} />
              <Row label="일시" value={seminar.dateDisplay} />
              <Row label="장소" value={seminar.location} />
              <Row
                label="참가비"
                value={formatPrice(seminar.price)}
                emphasize
              />
            </div>
          </section>

          {/* Bank info */}
          <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3">입금 안내</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="text-sm text-amber-900 mb-3 leading-relaxed">
                아래 계좌로 <b>{formatPrice(seminar.price)}</b>을 입금해주시면 참가가 확정됩니다.
              </div>
              <div className="bg-white rounded-lg p-4 space-y-1.5 text-sm">
                <Row label="은행" value={bankName} />
                <Row label="계좌번호" value={bankAccount} copyable />
                <Row label="예금주" value={bankHolder} />
              </div>
              <p className="text-xs text-amber-800 mt-3 leading-relaxed">
                · 입금자명은 <b>신청자 이름</b>과 동일하게 해주세요.
                <br />
                · 입금 확인 후 참가 확정 안내 문자를 발송해드립니다.
              </p>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/seminars"
              className="flex-1 text-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              다른 세미나 보기
            </Link>
            <Link
              href="/"
              className="flex-1 text-center bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
  copyable,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex gap-3 items-center">
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span
        className={`flex-1 ${
          emphasize ? "text-brand font-extrabold" : "text-gray-800 font-medium"
        }`}
      >
        {value}
      </span>
      {copyable && (
        <span className="text-xs text-gray-400 select-none">(복사해서 사용하세요)</span>
      )}
    </div>
  );
}
