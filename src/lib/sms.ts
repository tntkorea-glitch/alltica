import { SolapiMessageService } from "solapi";

const API_KEY = process.env.SOLAPI_API_KEY;
const API_SECRET = process.env.SOLAPI_API_SECRET;
const SENDER = process.env.SOLAPI_SENDER;

// SolAPI 단문(SMS) 최대 바이트 (EUC-KR 기준: 한글 2B, ASCII 1B). 초과 시 LMS 로 자동 전환되어 과금 달라짐.
export const SMS_MAX_BYTES = 90;
export const LMS_MAX_BYTES = 2000;

let messageService: SolapiMessageService | null = null;

function getService(): SolapiMessageService {
  if (!API_KEY || !API_SECRET) {
    throw new Error(
      "[sms] SOLAPI_API_KEY / SOLAPI_API_SECRET 가 .env.local 에 설정되지 않았습니다."
    );
  }
  if (!messageService) {
    messageService = new SolapiMessageService(API_KEY, API_SECRET);
  }
  return messageService;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export function byteLength(str: string): number {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    n += str.charCodeAt(i) > 127 ? 2 : 1;
  }
  return n;
}

export function truncateToBytes(str: string, maxBytes: number, suffix = ".."): string {
  if (byteLength(str) <= maxBytes) return str;
  const suffixBytes = byteLength(suffix);
  const limit = Math.max(0, maxBytes - suffixBytes);
  let bytes = 0;
  let end = 0;
  for (let i = 0; i < str.length; i++) {
    const w = str.charCodeAt(i) > 127 ? 2 : 1;
    if (bytes + w > limit) break;
    bytes += w;
    end = i + 1;
  }
  return str.slice(0, end) + suffix;
}

export interface SendSmsOptions {
  to: string;
  text: string;
  from?: string;
  /** 강제 단문 전송. 기본 true — 90바이트 초과 시 자동 자름. false 로 주면 LMS 로 자동 전환(과금 상승). */
  forceShort?: boolean;
}

export async function sendSms({ to, text, from, forceShort = true }: SendSmsOptions): Promise<void> {
  const sender = from || SENDER;
  if (!sender) {
    throw new Error(
      "[sms] 발신번호가 지정되지 않았습니다. SOLAPI_SENDER 환경변수를 설정하거나 from 인자로 넘기세요."
    );
  }

  const body = forceShort ? truncateToBytes(text, SMS_MAX_BYTES) : text;
  const bytes = byteLength(body);
  // 단문: <=90, 장문(LMS): <=2000
  const type: "SMS" | "LMS" = bytes <= SMS_MAX_BYTES ? "SMS" : "LMS";

  await getService().send({
    to: normalizePhone(to),
    from: normalizePhone(sender),
    text: body,
    type,
  });
}

export async function sendSmsSafe(options: SendSmsOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    await sendSms(options);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sms] 전송 실패:", message);
    return { ok: false, error: message };
  }
}
