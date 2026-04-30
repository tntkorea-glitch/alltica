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

export default async function MyPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/mypage");

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("users")
    .select("email, name, image, phone, role, created_at, last_login_at")
    .eq("email", session.user.email)
    .maybeSingle();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, seminar_slug, seminar_title, seminar_price, attendees, status, created_at")
    .eq("email", session.user.email)
    .order("created_at", { ascending: false });

  const apps = applications ?? [];

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
              <dd className="text-gray-900 mt-0.5">{profile?.phone || "미등록"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">권한</dt>
              <dd className="text-gray-900 mt-0.5">{profile?.role ?? "user"}</dd>
            </div>
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

        {/* Applications */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">신청한 세미나</h2>
          {apps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">아직 신청한 세미나가 없습니다.</p>
              <Link
                href="/seminars"
                className="inline-block mt-3 text-brand text-sm font-semibold hover:underline"
              >
                세미나 둘러보기 →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {apps.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {a.seminar_title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatKST(a.created_at)} · {a.attendees ?? 1}명
                      {a.seminar_price ? ` · ${formatPrice(a.seminar_price)}` : ""}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded border ${
                      STATUS_TONE[a.status] ?? STATUS_TONE.pending
                    }`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
