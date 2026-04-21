import { SolapiMessageService } from "solapi";

const API_KEY = process.env.SOLAPI_API_KEY;
const API_SECRET = process.env.SOLAPI_API_SECRET;
const SENDER = process.env.SOLAPI_SENDER;

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

export interface SendSmsOptions {
  to: string;
  text: string;
  from?: string;
}

export async function sendSms({ to, text, from }: SendSmsOptions): Promise<void> {
  const sender = from || SENDER;
  if (!sender) {
    throw new Error(
      "[sms] 발신번호가 지정되지 않았습니다. SOLAPI_SENDER 환경변수를 설정하거나 from 인자로 넘기세요."
    );
  }

  await getService().send({
    to: normalizePhone(to),
    from: normalizePhone(sender),
    text,
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
