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

const BUSINESS_CARD_TOOL = {
  name: "extract_business_card",
  description: "명함 이미지에서 연락처 정보를 추출합니다. 찾지 못한 필드는 null 로 반환합니다.",
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
      address: { type: ["string", "null"], description: "주소 (있으면 도로명/지번 포함 전체)" },
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
            text: "이 명함 이미지에서 정보를 추출해주세요. 연락처는 휴대전화번호를 우선 선택하고, 없으면 대표번호를 사용하세요. 하이픈 포함 한국 전화번호 형식을 유지하세요.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("[ocr] Claude 응답에서 tool_use 블록을 찾지 못했습니다.");
  }

  const fields = toolUse.input as BusinessCardFields;
  return { fields, raw: response };
}
