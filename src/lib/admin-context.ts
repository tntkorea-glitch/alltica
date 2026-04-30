import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";

export async function isAdminContext(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (await verifyAdminToken(token)) return true;
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const role = session?.user?.role;
    return role === "admin" || role === "subadmin";
  } catch {
    return false;
  }
}
