import { NextRequest, NextResponse } from "next/server";
import { addSubmission, getSubmissions, saveUploadedFile } from "@/lib/storage";
import { Submission } from "@/lib/types";
import { isAdminRequest } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const formSlug = formData.get("formSlug") as string;
    const formTitle = formData.get("formTitle") as string;
    const dataStr = formData.get("data") as string;
    const data = JSON.parse(dataStr);

    // Process file uploads
    const files: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        const fieldName = key.replace("file_", "");
        const buffer = Buffer.from(await value.arrayBuffer());
        const savedPath = saveUploadedFile(buffer, value.name);
        files[fieldName] = savedPath;
      }
    }

    const submission: Submission = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      formSlug,
      formTitle,
      data,
      files,
      submittedAt: new Date().toISOString(),
    };

    addSubmission(submission);

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
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

    const { searchParams } = new URL(request.url);
    const formSlug = searchParams.get("formSlug");
    let submissions = getSubmissions();

    if (formSlug) {
      submissions = submissions.filter((s) => s.formSlug === formSlug);
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET submissions error:", error);
    return NextResponse.json({ error: "데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
