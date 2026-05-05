"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  paymentKey: string;
  orderId: string;
  amount: number;
  slug: string;
}

export default function PaymentSuccessClient({ paymentKey, orderId, amount, slug }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "결제 확인 실패" }));
          throw new Error(error || "결제 확인에 실패했습니다.");
        }
        router.replace(`/seminars/${slug}/apply/complete?id=${orderId}&paid=1`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "결제 확인 중 오류가 발생했습니다.";
        setError(msg);
      }
    }
    confirm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">결제 확인 실패</h1>
          <p className="text-sm text-gray-600 bg-red-50 rounded-lg p-3">{error}</p>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={`/seminars/${slug}/apply/payment?id=${orderId}`}
              className="w-full text-center bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover transition-colors"
            >
              결제 다시 시도
            </Link>
            <Link
              href="/seminars"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              세미나 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-gray-700 font-semibold">결제를 확인하고 있습니다...</p>
        <p className="text-sm text-gray-400">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
