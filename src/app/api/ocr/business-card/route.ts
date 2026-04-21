import { NextRequest, NextResponse } from "next/server";
import { extractBusinessCard } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "image 파일이 필요합니다." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `지원하지 않는 이미지 형식입니다: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "이미지 크기는 8MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const { fields } = await extractBusinessCard(base64, file.type);

    return NextResponse.json({ fields });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR 처리 중 오류가 발생했습니다.";
    console.error("[api/ocr/business-card]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
