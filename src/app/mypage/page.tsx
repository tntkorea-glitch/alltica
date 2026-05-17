import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatPrice } from "@/lib/seminars";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  confirmed: "확정",
  cancelled: "취소",
};
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

function formatKST(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "미등록";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("02")) {
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

const ROLE_LABEL: Record<string, string> = {
  user: "일반회원",
  instructor: "강사",
  subadmin: "서브관리자",
  admin: "관리자",
};

export default async function MyPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/mypage");

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("users")
    .select("email, name, image, phone, role, kba_grade, business_name, created_at, last_login_at")
    .eq("email", session.user.email)
    .maybeSingle();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, seminar_slug, seminar_title, seminar_price, attendees, status, created_at")
    .eq("email", session.user.email)
    .order("created_at", { ascending: false });

  const { data: contestSubs } = await supabase
    .from("submissions")
    .select("id, form_slug, form_title, submitted_at")
    .eq("user_email", session.user.email)
    .like("form_slug", "contest-%")
    .order("submitted_at", { ascending: false });

  const apps = applications ?? [];
  const contests = contestSubs ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">마이페이지</h1>
          <p className="text-sm text-gray-500 mt-1">내 정보와 세미나 신청 내역을 확인할 수 있습니다.</p>
        </div>

        {/* Profile */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            {profile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt={profile.name ?? profile.email}
                className="w-16 h-16 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xl font-bold">
                {(profile?.name ?? profile?.email ?? "U").slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900 truncate">
                {profile?.name ?? "이름 미등록"}
              </div>
              <div className="text-sm text-gray-500 truncate">{profile?.email}</div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">연락처</dt>
              <dd className="text-gray-900 mt-0.5">{formatPhone(profile?.phone)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">회원등급</dt>
              <dd className="text-gray-900 mt-0.5">{(profile as any)?.kba_grade ?? "일반회원"}</dd>
            </div>
            {(profile as any)?.business_name && (
              <div>
                <dt className="text-gray-500">상호</dt>
                <dd className="text-gray-900 mt-0.5">{(profile as any).business_name}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">가입일</dt>
              <dd className="text-gray-900 mt-0.5">
                {profile?.created_at ? formatKST(profile.created_at) : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">최근 로그인</dt>
              <dd className="text-gray-900 mt-0.5">
                {profile?.last_login_at ? formatKST(profile.last_login_at) : "-"}
              </dd>
            </div>
          </dl>
        </section>

        {/* 세미나 신청 내역 */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">신청한 세미나</h2>
            <Link href="/seminars" className="text-xs text-brand hover:underline">세미나 보기 →</Link>
          </div>
          {apps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 신청한 세미나가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {apps.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{a.seminar_title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatKST(a.created_at)} · {a.attendees ?? 1}명
                      {a.seminar_price ? ` · ${formatPrice(a.seminar_price)}` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded border ${STATUS_TONE[a.status] ?? STATUS_TONE.pending}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 대회 신청 내역 */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">신청한 대회</h2>
            <Link href="/contests" className="text-xs text-brand hover:underline">대회 보기 →</Link>
          </div>
          {contests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 신청한 대회가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {contests.map((c) => {
                const type = c.form_slug?.endsWith("-committee") ? "조직위원" : c.form_slug?.endsWith("-judge") ? "심사위원" : "선수";
                return (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{c.form_title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {c.submitted_at ? formatKST(c.submitted_at) : "-"} · {type}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-200">
                      접수완료
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
