import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function JudgePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚖️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">IBC 온라인 심사 시스템</h1>
          <p className="text-gray-500 mb-8 text-sm">심사위원으로 배정된 Google 계정으로 로그인하세요.</p>
          <Link
            href="/login?callbackUrl=/judge"
            className="inline-block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Google로 로그인
          </Link>
        </div>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-700">계정 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "subadmin";

  if (isAdmin) {
    redirect("/judge/admin");
  }

  // 심사위원 배정 확인
  const { data: assignments } = await supabase
    .from("judge_assignments")
    .select("id, categories(name, competitions(title))")
    .eq("user_id", user.id);

  if (!assignments || assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">배정된 종목이 없습니다</h2>
          <p className="text-gray-500 text-sm mb-4">
            {session.user.email} 계정으로 로그인하셨습니다.<br />
            관리자에게 종목 배정을 요청하세요.
          </p>
        </div>
      </div>
    );
  }

  redirect("/judge/score");
}
