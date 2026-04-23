import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin-session";

export const runtime = "nodejs";

export const THEMES = ["navy", "peach", "mint", "lavender", "sunset", "ocean"] as const;
export type Theme = (typeof THEMES)[number];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "theme")
      .maybeSingle();
    if (error) throw error;
    const theme = (data?.value as Theme) || "navy";
    return NextResponse.json({ theme });
  } catch (err) {
    console.error("[api/settings/theme GET]", err);
    return NextResponse.json({ theme: "navy" }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const { theme } = (await request.json()) as { theme?: string };
    if (!theme || !THEMES.includes(theme as Theme)) {
      return NextResponse.json(
        { error: `지원하지 않는 테마입니다. 가능한 값: ${THEMES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "theme", value: theme, updated_at: new Date().toISOString() });
    if (error) throw error;

    return NextResponse.json({ theme, success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "저장 실패";
    console.error("[api/settings/theme PUT]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
