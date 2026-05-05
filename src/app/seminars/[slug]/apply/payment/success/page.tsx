import { redirect } from "next/navigation";
import PaymentSuccessClient from "@/components/PaymentSuccessClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  }>;
}

export default async function PaymentSuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { paymentKey, orderId, amount } = await searchParams;

  if (!paymentKey || !orderId || !amount) {
    redirect(`/seminars/${slug}/apply/payment/fail?message=${encodeURIComponent("결제 정보가 올바르지 않습니다.")}`);
  }

  return (
    <PaymentSuccessClient
      paymentKey={paymentKey}
      orderId={orderId}
      amount={Number(amount)}
      slug={slug}
    />
  );
}
