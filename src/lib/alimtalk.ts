import { SolapiMessageService } from "solapi";
import type { SolApiCredentials } from "./sms";

const GLOBAL_PF_ID = process.env.SOLAPI_PF_ID;
const TEMPLATE_APPLICANT = process.env.SOLAPI_ALIMTALK_TEMPLATE_APPLICANT;
const TEMPLATE_ADMIN = process.env.SOLAPI_ALIMTALK_TEMPLATE_ADMIN;

export interface AlimtalkOptions {
  smsCreds?: SolApiCredentials;
  pfId?: string;
}

function getService(creds?: SolApiCredentials): SolapiMessageService {
  if (creds) return new SolapiMessageService(creds.apiKey, creds.apiSecret);
  const key = process.env.SOLAPI_API_KEY;
  const secret = process.env.SOLAPI_API_SECRET;
  if (!key || !secret) throw new Error("SOLAPI_API_KEY / SOLAPI_API_SECRET 미설정");
  return new SolapiMessageService(key, secret);
}

function normalizePhone(p: string) {
  return p.replace(/[^0-9]/g, "");
}

// ────────────────────────────────────────────────────────────
// 신청자 알림톡
// 템플릿 변수: #{이름} #{날짜} #{금액} #{은행} #{계좌번호}
// ────────────────────────────────────────────────────────────
export async function sendAlimtalkApplicant({
  to,
  from,
  name,
  dateLabel,
  price,
  bankName,
  bankAccount,
  opts,
}: {
  to: string;
  from?: string;
  name: string;
  dateLabel: string;
  price: string;
  bankName: string;
  bankAccount: string;
  opts?: AlimtalkOptions;
}): Promise<{ ok: boolean; error?: string }> {
  const pfId = opts?.pfId || GLOBAL_PF_ID;
  const templateId = TEMPLATE_APPLICANT;
  const sender = from || opts?.smsCreds?.sender || process.env.SOLAPI_SENDER;

  if (!pfId || !templateId) {
    return { ok: false, error: "알림톡 미설정 (SOLAPI_PF_ID / SOLAPI_ALIMTALK_TEMPLATE_APPLICANT)" };
  }
  if (!sender) {
    return { ok: false, error: "발신번호 미설정" };
  }

  try {
    const svc = getService(opts?.smsCreds);
    await svc.send({
      to: normalizePhone(to),
      from: normalizePhone(sender),
      // SMS 대체 발송 문자 (카카오 미설치 수신자 대상)
      text: `[Alltica] ${dateLabel} 접수완료\n참가비 ${price}\n${bankName} ${bankAccount}\n입금 후 확정`,
      type: "ATA",
      kakaoOptions: {
        pfId,
        templateId,
        variables: {
          "#{이름}": name,
          "#{날짜}": dateLabel,
          "#{금액}": price,
          "#{은행}": bankName,
          "#{계좌번호}": bankAccount,
        },
        disableSms: false,
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[alimtalk] 신청자 발송 실패:", message);
    return { ok: false, error: message };
  }
}

// ────────────────────────────────────────────────────────────
// 관리자 알림톡
// 템플릿 변수: #{이름} #{연락처} #{날짜}
// ────────────────────────────────────────────────────────────
export async function sendAlimtalkAdmin({
  to,
  from,
  name,
  phone,
  dateLabel,
  opts,
}: {
  to: string;
  from?: string;
  name: string;
  phone: string;
  dateLabel: string;
  opts?: AlimtalkOptions;
}): Promise<{ ok: boolean; error?: string }> {
  const pfId = opts?.pfId || GLOBAL_PF_ID;
  const templateId = TEMPLATE_ADMIN;
  const sender = from || opts?.smsCreds?.sender || process.env.SOLAPI_SENDER;

  if (!pfId || !templateId) {
    return { ok: false, error: "알림톡 미설정 (SOLAPI_PF_ID / SOLAPI_ALIMTALK_TEMPLATE_ADMIN)" };
  }
  if (!sender) {
    return { ok: false, error: "발신번호 미설정" };
  }

  try {
    const svc = getService(opts?.smsCreds);
    await svc.send({
      to: normalizePhone(to),
      from: normalizePhone(sender),
      text: `[Alltica] 신규신청\n${name} ${phone}\n${dateLabel} 세미나`,
      type: "ATA",
      kakaoOptions: {
        pfId,
        templateId,
        variables: {
          "#{이름}": name,
          "#{연락처}": phone,
          "#{날짜}": dateLabel,
        },
        disableSms: false,
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[alimtalk] 관리자 발송 실패:", message);
    return { ok: false, error: message };
  }
}
