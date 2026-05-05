"use client";

import { useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { formatPrice } from "@/lib/seminars";

interface Props {
  clientKey: string;
  applicationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  orderName: string;
  amount: number;
  slug: string;
}

export default function TossPaymentWidget({
  clientKey,
  applicationId,
  customerName,
  customerPhone,
  customerEmail,
  orderName,
  amount,
  slug,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId: applicationId,
        orderName,
        successUrl: `${window.location.origin}/seminars/${slug}/apply/payment/success`,
        failUrl: `${window.location.origin}/seminars/${slug}/apply/payment/fail`,
        customerName,
        customerMobilePhone: customerPhone.replace(/[^0-9]/g, ""),
        ...(customerEmail ? { customerEmail } : {}),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "결제 요청에 실패했습니다.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-brand/5 border border-brand/10 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">결제 금액</span>
          <span className="text-xl font-extrabold text-brand">{formatPrice(amount)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-brand text-white py-4 rounded-xl font-bold text-base hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            결제 창 열기 중...
          </span>
        ) : (
          "카드로 결제하기"
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        토스페이먼츠 안전 결제 · 신용/체크카드
      </p>
    </div>
  );
}
