import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface JudgeAdminContext {
  userId: string;
  email: string;
  role: "admin" | "subadmin";
  name?: string | null;
}

export interface JudgeContext {
  userId: string;
  email: string;
  name?: string | null;
  isAdmin: boolean;
}

export async function getJudgeAdminContext(): Promise<JudgeAdminContext | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!data) return null;
  if (data.role !== "admin" && data.role !== "subadmin") return null;

  return { userId: data.id, email: data.email, name: data.name, role: data.role };
}

export async function getJudgeContext(): Promise<JudgeContext | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!data) return null;

  const isAdmin = data.role === "admin" || data.role === "subadmin";

  if (!isAdmin) {
    const { data: assignment } = await supabase
      .from("judge_assignments")
      .select("id")
      .eq("user_id", data.id)
      .limit(1)
      .maybeSingle();

    if (!assignment) return null;
  }

  return { userId: data.id, email: data.email, name: data.name, isAdmin };
}
