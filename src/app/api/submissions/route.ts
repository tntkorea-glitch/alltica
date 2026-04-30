import { NextRequest, NextResponse } from "next/server";
import { Submission } from "@/lib/types";
import { isAdminRequest } from "@/lib/admin-session";
import { getSupabaseAdmin, SUBMISSION_FILES_BUCKET } from "@/lib/supabase";

const SIGNED_URL_EXPIRY = 60 * 60; // 1시간

function safeName(originalName: string): string {
  return originalName.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const formSlug = formData.get("formSlug") as string;
    const formTitle = formData.get("formTitle") as string;
    const dataStr = formData.get("data") as string;
    const data = JSON.parse(dataStr);

    if (!formSlug || !formTitle) {
      return NextResponse.json(
        { error: "formSlug, formTitle 은 필수입니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 첨부 파일 → Storage 업로드
    const files: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        const fieldName = key.replace("file_", "");
        const buffer = Buffer.from(await value.arrayBuffer());
        const path = `${formSlug}/${Date.now()}_${safeName(value.name)}`;
        const { error: upErr } = await supabase.storage
          .from(SUBMISSION_FILES_BUCKET)
          .upload(path, buffer, {
            contentType: value.type || "application/octet-stream",
            upsert: false,
          });
        if (upErr) {
          console.error("[submissions POST upload]", upErr);
          return NextResponse.json(
            { error: `파일 업로드 실패: ${upErr.message}` },
            { status: 500 }
          );
        }
        files[fieldName] = path;
      }
    }

    const { data: inserted, error } = await supabase
      .from("submissions")
      .insert({
        form_slug: formSlug,
        form_title: formTitle,
        data,
        files,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[submissions POST insert]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted.id }, { status: 201 });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "제출 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const formSlug = searchParams.get("formSlug");

    let query = supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (formSlug) query = query.eq("form_slug", formSlug);

    const { data: rows, error } = await query;
    if (error) {
      console.error("[submissions GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const submissions: Submission[] = await Promise.all(
      (rows || []).map(async (row) => {
        const storedFiles = (row.files || {}) as Record<string, string>;
        const signedFiles: Record<string, string> = {};
        for (const [field, path] of Object.entries(storedFiles)) {
          if (!path) continue;
          const { data: signed } = await supabase.storage
            .from(SUBMISSION_FILES_BUCKET)
            .createSignedUrl(path, SIGNED_URL_EXPIRY);
          if (signed?.signedUrl) signedFiles[field] = signed.signedUrl;
        }
        return {
          id: row.id,
          formSlug: row.form_slug,
          formTitle: row.form_title,
          data: row.data || {},
          files: signedFiles,
          submittedAt: row.submitted_at,
        };
      })
    );

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET submissions error:", error);
    return NextResponse.json({ error: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
