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

  if (!user) return NextResponse.json({ isJudge: false });
  if (user.role === "admin" || user.role === "subadmin") {
    return NextResponse.json({ isJudge: false });
  }

  const { data: assignments } = await supabase
    .from("judge_assignments")
    .select("title, categories(name, major_category)")
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
  const name = user.name || session.user.name || "";

  return NextResponse.json({ isJudge: true, name, title, majorCategories });
}
