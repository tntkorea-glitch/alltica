import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    message?: string;
    code?: string;
    orderId?: string;
  }>;
}

export default async function PaymentFailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { message, orderId } = await searchParams;

  const errorMessage = message ? decodeURIComponent(message) : "결제 중 오류가 발생했습니다.";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="text-5xl mb-2">❌</div>
        <h1 className="text-xl font-bold text-gray-800">결제에 실패했습니다</h1>
        <p className="text-sm text-gray-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {errorMessage}
        </p>
        <div className="flex flex-col gap-3 pt-2">
          {orderId ? (
            <Link
              href={`/seminars/${slug}/apply/payment?id=${orderId}`}
              className="w-full text-center bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover transition-colors"
            >
              결제 다시 시도
            </Link>
          ) : (
            <Link
              href={`/seminars/${slug}/apply`}
              className="w-full text-center bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover transition-colors"
            >
              신청 다시 작성
            </Link>
          )}
          <Link
            href="/seminars"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            세미나 목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
