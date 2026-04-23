import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherContext } from "@/lib/teacher-auth";
import { getSeminarsByInstructor, getAllSeminars, formatPrice } from "@/lib/seminars";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const ctx = await getTeacherContext();
  if (!ctx) redirect("/login?callbackUrl=/teacher");

  const isPriv = ctx.role === "admin" || ctx.role === "subadmin";
  const seminars = isPriv
    ? await getAllSeminars()
    : await getSeminarsByInstructor(ctx.userId);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand bg-blue-50 px-2 py-0.5 rounded">
                {ctx.role === "admin"
                  ? "관리자 (전체 세미나)"
                  : ctx.role === "subadmin"
                    ? "서브관리자 (전체 세미나)"
                    : "강사 대시보드"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">내 세미나</h1>
            <p className="text-sm text-gray-500 mt-1">
              {ctx.email} · {ctx.phone ? `발신 기본값 ${ctx.phone}` : "연락처 미등록"}
            </p>
          </div>
          <Link
            href="/teacher/seminars/new"
            className="shrink-0 bg-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-hover shadow-md shadow-brand/20"
          >
            + 세미나 등록
          </Link>
        </div>

        {seminars.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-500 text-sm">아직 등록한 세미나가 없습니다.</p>
            <Link
              href="/teacher/seminars/new"
              className="inline-block mt-4 text-brand text-sm font-semibold hover:underline"
            >
              첫 세미나 등록하기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {seminars.map((s) => (
              <Link
                key={s.id}
                href={`/teacher/seminars/${s.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-brand/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={s.status} />
                      <span className="text-xs text-gray-400">/{s.slug}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 truncate">
                      {s.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.dateDisplay} · {s.location}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-brand">
                      {formatPrice(s.price)}
                    </div>
                    {s.capacity != null && (
                      <div className="text-xs text-gray-400 mt-0.5">정원 {s.capacity}명</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    upcoming: { label: "예정", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    open: { label: "모집중", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    closed: { label: "마감", cls: "bg-gray-100 text-gray-500 border-gray-200" },
    completed: { label: "종료", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  };
  const s = map[status] ?? map.upcoming;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}
