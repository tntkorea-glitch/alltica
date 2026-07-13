import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, CONTESTANT_FILES_BUCKET } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { contestantId, fileName, fileType } = await request.json();
  if (!contestantId || !fileName || !fileType) {
    return NextResponse.json({ error: "contestantId, fileName, fileType 필수" }, { status: 400 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${contestantId}/${Date.now()}_${safeName}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(CONTESTANT_FILES_BUCKET)
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, path, ext });
}
