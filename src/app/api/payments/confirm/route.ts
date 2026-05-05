import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    if (!paymentKey || !orderId || typeof amount !== "number") {
      return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. DB에서 실제 결제금액 확인 (클라이언트 금액 조작 방지)
    const { data: app } = await supabase
      .from("applications")
      .select("id, seminar_price, attendees, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (!app) {
      return NextResponse.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    if (app.payment_status === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const expectedAmount = (app.seminar_price || 0) * (app.attendees || 1);
    if (amount !== expectedAmount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
    }

    // 2. 토스페이먼츠 결제 승인
    const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "결제 서버 설정 오류입니다." }, { status: 500 });
    }

    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
      const tossError = await tossRes.json().catch(() => ({})) as { message?: string };
      console.error("[payments/confirm] 토스 승인 실패:", tossError);
      return NextResponse.json(
        { error: tossError.message || "결제 승인에 실패했습니다." },
        { status: 400 }
      );
    }

    // 3. DB 결제 상태 업데이트
    const { error: updateErr } = await supabase
      .from("applications")
      .update({ payment_status: "paid", toss_payment_key: paymentKey })
      .eq("id", orderId);

    if (updateErr) {
      console.error("[payments/confirm] DB 업데이트 실패:", updateErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "결제 확인 중 오류가 발생했습니다.";
    console.error("[api/payments/confirm]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
