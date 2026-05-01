import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, BUSINESS_CARD_BUCKET } from "@/lib/supabase";
import { sendSmsSafe, byteLength, SMS_MAX_BYTES } from "@/lib/sms";
import { getSeminarBySlug, formatPrice } from "@/lib/seminars";
import { isAdminRequest } from "@/lib/admin-session";

export const runtime = "nodejs";
export const maxDuration = 30;

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function shortDateLabel(iso: string): string {
  const d = new Date(iso);
  const ampm = d.getHours() < 12 ? "오전" : "오후";
  return `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]}) ${ampm}`;
}

const MAX_CARD_BYTES = 8 * 1024 * 1024; // 8MB

interface ApplicationPayload {
  seminarSlug: string;
  name: string;
  company?: string;
  position?: string;
  phone: string;
  email?: string;
  address?: string;
  attendees?: number;
  requests?: string;
  ocrRaw?: unknown;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  return "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const dataRaw = formData.get("data");
    if (typeof dataRaw !== "string") {
      return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const payload = JSON.parse(dataRaw) as ApplicationPayload;

    if (!payload.seminarSlug || !payload.name || !payload.phone) {
      return NextResponse.json(
        { error: "세미나/이름/연락처는 필수입니다." },
        { status: 400 }
      );
    }

    const seminar = await getSeminarBySlug(payload.seminarSlug);
    if (!seminar) {
      return NextResponse.json({ error: "존재하지 않는 세미나입니다." }, { status: 404 });
    }
    if (seminar.status !== "open" && seminar.status !== "upcoming") {
      return NextResponse.json({ error: "신청을 받지 않는 세미나입니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. 명함 이미지 업로드 (있을 때만)
    let businessCardUrl: string | null = null;
    const cardFile = formData.get("businessCard");
    if (cardFile instanceof File && cardFile.size > 0) {
      if (cardFile.size > MAX_CARD_BYTES) {
        return NextResponse.json(
          { error: "명함 이미지는 8MB 이하여야 합니다." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await cardFile.arrayBuffer());
      const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extFromMime(cardFile.type)}`;
      const { error: uploadErr } = await supabase.storage
        .from(BUSINESS_CARD_BUCKET)
        .upload(path, buffer, { contentType: cardFile.type, upsert: false });
      if (uploadErr) {
        console.error("[applications] 명함 업로드 실패:", uploadErr);
        return NextResponse.json(
          { error: "명함 이미지 업로드에 실패했습니다." },
          { status: 500 }
        );
      }
      businessCardUrl = path;
    }

    // 2. 신청 저장
    const { data: row, error: insertErr } = await supabase
      .from("applications")
      .insert({
        seminar_slug: seminar.slug,
        seminar_title: seminar.title,
        seminar_price: seminar.price,
        name: payload.name.trim(),
        company: payload.company?.trim() || null,
        position: payload.position?.trim() || null,
        phone: sanitizePhone(payload.phone),
        email: payload.email?.trim() || null,
        address: payload.address?.trim() || null,
        attendees: payload.attendees || 1,
        requests: payload.requests?.trim() || null,
        business_card_url: businessCardUrl,
        ocr_raw: payload.ocrRaw ?? null,
      })
      .select("id")
      .single();

    if (insertErr || !row) {
      console.error("[applications] insert 실패:", insertErr);
      return NextResponse.json(
        { error: "신청 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 3. SMS 발송 (단문 90바이트 이내, 실패해도 신청 자체는 성공 처리)
    const bankName = process.env.BANK_NAME || "은행";
    const bankAccount = process.env.BANK_ACCOUNT_NUMBER || "관리자확인";

    const dateLabel = shortDateLabel(seminar.startAt);

    const applicantText =
      `[Alltica] ${dateLabel} 접수완료\n` +
      `참가비 ${formatPrice(seminar.price)}\n` +
      `${bankName} ${bankAccount}\n` +
      `입금 후 확정`;

    // 강사 자체 Solapi 설정 조회
    let smsCreds: import("@/lib/sms").SolApiCredentials | undefined;
    if (seminar.instructorId) {
      const { data: instructor } = await supabase
        .from("users")
        .select("use_own_solapi, solapi_api_key, solapi_api_secret, solapi_sender")
        .eq("id", seminar.instructorId)
        .maybeSingle();
      if (
        instructor?.use_own_solapi &&
        instructor.solapi_api_key &&
        instructor.solapi_api_secret &&
        instructor.solapi_sender
      ) {
        smsCreds = {
          apiKey: instructor.solapi_api_key,
          apiSecret: instructor.solapi_api_secret,
          sender: instructor.solapi_sender,
        };
      }
    }

    // 발신번호: 강사 자체 sender → 세미나 설정 강사번호 → 전역 SOLAPI_SENDER 순
    const senderPhone = smsCreds?.sender || seminar.instructorSenderPhone || undefined;

    console.log(`[sms] 신청자 메시지 ${byteLength(applicantText)}B (단문 한도 ${SMS_MAX_BYTES}B) creds=${smsCreds ? "강사" : "공용"}`);
    await sendSmsSafe({ to: payload.phone, text: applicantText, from: senderPhone, forceShort: true, creds: smsCreds });

    // 관리자 수신번호: 세미나 강사 번호 우선, 없으면 전역 ADMIN_NOTIFY_PHONES
    const notifyPhonesRaw = seminar.instructorNotifyPhones || process.env.ADMIN_NOTIFY_PHONES || "";
    const adminPhones = notifyPhonesRaw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const adminText =
      `[Alltica] 신규신청\n` +
      `${payload.name} ${payload.phone}\n` +
      `${dateLabel} 세미나`;

    console.log(`[sms] 관리자 메시지 ${byteLength(adminText)}B → ${adminPhones.length}명`);
    await Promise.all(
      adminPhones.map((phone) =>
        sendSmsSafe({ to: phone, text: adminText, from: senderPhone, forceShort: true, creds: smsCreds }),
      ),
    );

    return NextResponse.json({ id: row.id, success: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "신청 처리 중 오류가 발생했습니다.";
    console.error("[api/applications]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
// GET /api/applications — 관리자 페이지에서 조회
// admin_session 쿠키 필수, optional: ?seminarSlug=xxx
// ============================================================
const SIGNED_URL_EXPIRY = 60 * 60; // 1시간

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const seminarSlug = searchParams.get("seminarSlug");

    let query = supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (seminarSlug) query = query.eq("seminar_slug", seminarSlug);

    const { data: rows, error } = await query;
    if (error) {
      console.error("[applications GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 명함 이미지 서명 URL 발급 (병렬)
    const withSigned = await Promise.all(
      (rows || []).map(async (row) => {
        let signedUrl: string | null = null;
        if (row.business_card_url) {
          const { data: signed } = await supabase.storage
            .from(BUSINESS_CARD_BUCKET)
            .createSignedUrl(row.business_card_url, SIGNED_URL_EXPIRY);
          signedUrl = signed?.signedUrl || null;
        }
        return { ...row, business_card_signed_url: signedUrl };
      })
    );

    return NextResponse.json(withSigned);
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
