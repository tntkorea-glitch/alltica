import Link from "next/link";
import { redirect } from "next/navigation";
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
          <Link href="/login?callbackUrl=/judge"
            className="inline-block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            Google로 로그인
          </Link>
        </div>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from("users")
    .select("id, role, name")
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

  if (user.role === "admin" || user.role === "subadmin") {
    redirect("/judge/admin");
  }

  const { data: assignments } = await supabase
    .from("judge_assignments")
    .select("id, title, judge_name, commission_only, category_id, categories(id, name, major_category, competitions(title))")
    .eq("user_id", user.id)
    .order("created_at");

  if (!assignments || assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">배정된 종목이 없습니다</h2>
          <p className="text-gray-500 text-sm">
            {session.user.email} 계정으로 로그인하셨습니다.<br />
            관리자에게 종목 배정을 요청하세요.
          </p>
        </div>
      </div>
    );
  }

  // 심사위원 정보
  const judgeName = assignments[0].judge_name || user.name || session.user.name || "";
  const judgeTitle = assignments[0].title || "";
  const hasScoring = assignments.some((a) => !a.commission_only);

  // 대회별 → 대종목별 그룹핑
  type CompGroup = { compTitle: string; majors: Map<string, string[]> };
  const compMap = new Map<string, CompGroup>();
  for (const a of assignments) {
    const cat = a.categories as unknown as { id: string; name: string; major_category?: string; competitions?: { title: string } } | null;
    if (!cat) continue;
    const compTitle = cat.competitions?.title ?? "대회";
    if (!compMap.has(compTitle)) compMap.set(compTitle, { compTitle, majors: new Map() });
    const major = cat.major_category ?? "(미분류)";
    const grp = compMap.get(compTitle)!;
    if (!grp.majors.has(major)) grp.majors.set(major, []);
    grp.majors.get(major)!.push(cat.name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-5">

        {/* 환영 카드 */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
            <p className="text-blue-200 text-sm mb-1">제 12회 IBC 국제뷰티스트챔피언십 in 2026</p>
            <h1 className="text-2xl font-bold">
              {judgeName}
              {(() => {
                const majors = [...new Set(
                  [...compMap.values()].flatMap((comp) => [...comp.majors.keys()])
                )];
                return majors.length > 0
                  ? ` ${majors.join(" / ")} ${judgeTitle}`
                  : judgeTitle ? ` ${judgeTitle}` : "";
              })()}
            </h1>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* 배정 종목 */}
            {[...compMap.values()].map((comp) => (
              <div key={comp.compTitle}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">배정 종목</p>
                <div className="space-y-2">
                  {[...comp.majors.entries()].map(([major, subs]) => (
                    <div key={major} className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {major}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {subs.map((s) => (
                          <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 위촉 안내 */}
            {!hasScoring && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                위촉 심사위원으로 배정되어 있습니다. 온라인 채점은 진행하지 않습니다.
              </div>
            )}
          </div>
        </div>

        {/* 심사 시작 버튼 */}
        {hasScoring && (
          <Link href="/judge/score"
            className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-bold text-lg rounded-2xl shadow-md transition">
            선수 심사 시작 →
          </Link>
        )}

        <p className="text-center text-xs text-gray-400">{session.user.email}</p>
      </div>
    </div>
  );
}
