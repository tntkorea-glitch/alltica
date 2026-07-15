import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ isJudge: false });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) return NextResponse.json({ isJudge: false, isAdmin: false });
  if (user.role === "admin" || user.role === "subadmin") {
    return NextResponse.json({ isJudge: false, isAdmin: true });
  }

  const { data: assignments } = await supabase
    .from("judge_assignments")
    .select("title, judge_name, categories(name, major_category)")
    .eq("user_id", user.id)
    .eq("commission_only", false);

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ isJudge: false });
  }

  const majorCategories = [
    ...new Set(
      assignments
        .map((a) => (a.categories as { major_category?: string } | null)?.major_category)
        .filter(Boolean) as string[]
    ),
  ];

  const title = (assignments[0] as { title?: string }).title ?? "";
  const judgeName = (assignments as Array<{ judge_name?: string | null }>).find(a => a.judge_name)?.judge_name ?? null;
  const name = judgeName || user.name || session.user.name || "";

  return NextResponse.json({ isJudge: true, isAdmin: false, name, title, majorCategories });
}
