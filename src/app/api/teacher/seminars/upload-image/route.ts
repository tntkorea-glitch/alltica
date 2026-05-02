import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, SEMINAR_IMAGES_BUCKET } from "@/lib/supabase";
import { getTeacherContext } from "@/lib/teacher-auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const ctx = await getTeacherContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP, GIF만 업로드 가능합니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `seminars/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  const { error: upErr } = await supabase.storage
    .from(SEMINAR_IMAGES_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(SEMINAR_IMAGES_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
