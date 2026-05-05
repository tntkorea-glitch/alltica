import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSeminarBySlug } from "@/lib/seminars";
import { getSupabaseAdmin } from "@/lib/supabase";
import TossPaymentWidget from "@/components/TossPaymentWidget";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function PaymentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { id } = await searchParams;

  if (!id) redirect(`/seminars/${slug}/apply`);

  const [seminar, { data: app }] = await Promise.all([
    getSeminarBySlug(slug),
    getSupabaseAdmin()
      .from("applications")
      .select("id, name, phone, email, seminar_price, attendees, payment_status")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!seminar) notFound();
  if (!app) redirect(`/seminars/${slug}/apply`);

  if (app.payment_status === "paid") {
    redirect(`/seminars/${slug}/apply/complete?id=${id}&paid=1`);
  }

  const amount = (app.seminar_price || 0) * (app.attendees || 1);
  const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;

  if (!clientKey) {
    redirect(`/seminars/${slug}/apply/complete?id=${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand to-brand-light" />
        <div className="relative z-10 max-w-2xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link
            href={`/seminars/${slug}/apply`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            신청 정보 수정
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">결제</h1>
          <p className="text-blue-100/70 text-sm mt-2">{seminar.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10 space-y-6">
          <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3">신청 내역</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <Row label="세미나" value={seminar.title} />
              <Row label="일시" value={seminar.dateDisplay} />
              <Row label="장소" value={seminar.location} />
              <Row label="신청자" value={app.name} />
              {app.attendees > 1 && (
                <Row label="참석 인원" value={`${app.attendees}명`} />
              )}
            </div>
          </section>

          <TossPaymentWidget
            clientKey={clientKey}
            applicationId={app.id}
            customerName={app.name}
            customerPhone={app.phone}
            customerEmail={app.email}
            orderName={seminar.title}
            amount={amount}
            slug={slug}
          />

          <p className="text-xs text-center text-gray-400 pt-2">
            결제 완료 후 참가가 확정됩니다
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="flex-1 text-gray-800 font-medium">{value}</span>
    </div>
  );
}
