import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface TeacherContext {
  userId: string;
  email: string;
  role: "instructor" | "subadmin" | "admin";
  name?: string | null;
  phone?: string | null;
}

export async function getTeacherContext(): Promise<TeacherContext | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, phone, role")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error || !data) return null;
  if (data.role !== "instructor" && data.role !== "subadmin" && data.role !== "admin") return null;

  return {
    userId: data.id,
    email: data.email,
    role: data.role,
    name: data.name,
    phone: data.phone,
  };
}
