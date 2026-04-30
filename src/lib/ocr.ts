import Anthropic from "@anthropic-ai/sdk";

const API_KEY = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!API_KEY) {
    throw new Error(
      "[ocr] ANTHROPIC_API_KEY 가 .env.local 에 설정되지 않았습니다."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: API_KEY });
  }
  return client;
}

export interface BusinessCardFields {
  name: string | null;
  company: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

// OCR이 정보를 찾지 못했을 때 모델이 placeholder 문자열("<UNKNOWN>", "n/a" 등)을
// 반환하는 경우가 있어 null로 정규화한다.
const NULLISH_VALUES = new Set([
  "",
  "-",
  "—",
  "n/a",
  "na",
  "none",
  "null",
  "unknown",
  "<unknown>",
  "<n/a>",
  "<none>",
  "<null>",
  "없음",
  "정보없음",
  "확인불가",
]);

function normalize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // <ANYTHING> 형태 (홑꺽쇠 안에 영문/한글) 도 placeholder 로 간주
  if (/^<[^>]+>$/.test(trimmed)) return null;
  if (NULLISH_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

function sanitizeFields(fields: BusinessCardFields): BusinessCardFields {
  return {
    name: normalize(fields.name),
    company: normalize(fields.company),
    position: normalize(fields.position),
    phone: normalize(fields.phone),
    email: normalize(fields.email),
    address: normalize(fields.address),
  };
}

const BUSINESS_CARD_TOOL = {
  name: "extract_business_card",
  description:
    "명함 이미지에서 연락처 정보를 추출합니다. 명함에서 직접 읽을 수 없는 필드는 반드시 JSON null 로 반환하고, 'UNKNOWN', '<UNKNOWN>', 'n/a', '없음' 같은 자리표시자 문자열은 절대 사용하지 마세요.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: ["string", "null"], description: "이름" },
      company: { type: ["string", "null"], description: "회사/상호명" },
      position: { type: ["string", "null"], description: "직책/직함" },
      phone: {
        type: ["string", "null"],
        description: "휴대전화번호 (010-XXXX-XXXX 형식 우선, 없으면 대표번호)",
      },
      email: { type: ["string", "null"], description: "이메일 주소" },
      address: {
        type: ["string", "null"],
        description:
          "주소 전체. 시/도, 시/군/구, 도로명 또는 지번, 건물명, 동/호수까지 명함에 적힌 그대로 포함하세요. 예: '서울특별시 강남구 테헤란로 123 5층 501호'. 줄바꿈은 공백으로 연결하고, '주소', 'ADDRESS' 같은 라벨 단어는 빼세요. 주소로 보이는 텍스트가 있으면 일부만이라도 반드시 추출하고, 정말 어떤 주소 정보도 없을 때만 null.",
      },
    },
    required: ["name", "company", "position", "phone", "email", "address"],
  },
};

function detectMediaType(mimeType: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const m = mimeType.toLowerCase();
  if (m.includes("png")) return "image/png";
  if (m.includes("gif")) return "image/gif";
  if (m.includes("webp")) return "image/webp";
  return "image/jpeg";
}

export async function extractBusinessCard(
  imageBase64: string,
  mimeType: string
): Promise<{ fields: BusinessCardFields; raw: unknown }> {
  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [BUSINESS_CARD_TOOL],
    tool_choice: { type: "tool", name: "extract_business_card" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: detectMediaType(mimeType),
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: [
              "이 명함 이미지에서 정보를 추출해주세요.",
              "- 연락처: 휴대전화번호를 우선 선택하고 없으면 대표번호. 한국 전화번호 형식(하이픈 포함)을 유지하세요.",
              "- 주소: 시/도, 시/군/구, 도로명/지번, 건물명, 층/호수까지 명함에 적힌 모든 주소 텍스트를 한 줄로 합쳐서 추출하세요. 여러 줄로 나뉘어 있어도 공백으로 연결하세요. 우편번호가 있으면 맨 앞에 (12345) 형식으로 포함하세요. '주소', 'ADD', 'ADDRESS' 같은 라벨 단어는 제외하세요. 명함에 주소처럼 보이는 텍스트(도로명/동/번지/빌딩명 등 어느 것이든)가 조금이라도 보이면 반드시 추출하세요.",
              "- 명함에서 정말 보이지 않는 필드만 null 로 반환하고, 'UNKNOWN' 같은 자리표시자 문자열은 절대 사용하지 마세요.",
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("[ocr] Claude 응답에서 tool_use 블록을 찾지 못했습니다.");
  }

  const fields = sanitizeFields(toolUse.input as BusinessCardFields);
  return { fields, raw: response };
}
