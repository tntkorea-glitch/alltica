import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, CONTESTANT_FILES_BUCKET } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

// POST: 업로드 완료 후 파일 메타데이터 등록
export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { contestant_id, storage_path, file_name, file_type } = await request.json();
  if (!contestant_id || !storage_path || !file_name || !file_type) {
    return NextResponse.json({ error: "contestant_id, storage_path, file_name, file_type 필수" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: publicUrlData } = supabase.storage
    .from(CONTESTANT_FILES_BUCKET)
    .getPublicUrl(storage_path);

  const { data, error } = await supabase
    .from("contestant_files")
    .insert({
      contestant_id,
      storage_path,
      file_name,
      file_type,
      uploaded_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, public_url: publicUrlData.publicUrl }, { status: 201 });
}

// DELETE: 파일 삭제
export async function DELETE(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id, storage_path } = await request.json();
  if (!id) return NextResponse.json({ error: "id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  if (storage_path) {
    await supabase.storage.from(CONTESTANT_FILES_BUCKET).remove([storage_path]);
  }

  const { error } = await supabase.from("contestant_files").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
