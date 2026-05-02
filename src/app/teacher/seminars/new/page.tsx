import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherContext } from "@/lib/teacher-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import TeacherSeminarForm, { TeacherSeminarFormValues } from "@/components/TeacherSeminarForm";

export const dynamic = "force-dynamic";

export default async function NewSeminarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const ctx = await getTeacherContext();
  if (!ctx) redirect("/login?callbackUrl=/teacher/seminars/new");

  const { from } = await searchParams;
  let prefill: Partial<TeacherSeminarFormValues> | undefined;

  if (from) {
    const supabase = getSupabaseAdmin();
    const { data: row } = await supabase
      .from("seminars")
      .select("*")
      .eq("id", from)
      .maybeSingle();

    if (row) {
      const isPriv = ctx.role === "admin" || ctx.role === "subadmin";
      if (isPriv || row.instructor_id === ctx.userId) {
        prefill = {
          slug: "",
          title: row.title,
          subtitle: row.subtitle ?? "",
          dateDisplay: "",
          startAt: "",
          endAt: "",
          location: row.location,
          instructorName: row.instructor_name,
          instructorSenderPhone: row.instructor_sender_phone ?? "",
          instructorNotifyPhones: row.instructor_notify_phones ?? "",
          price: row.price,
          capacity: row.capacity != null ? String(row.capacity) : "",
          summary: row.summary ?? "",
          description: row.description ?? "",
          curriculum: Array.isArray(row.curriculum) ? row.curriculum.join("\n") : "",
          target: Array.isArray(row.target) ? row.target.join("\n") : "",
          tags: Array.isArray(row.tags) ? row.tags.join(",") : "",
          status: "upcoming" as const,
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/teacher"
          className="text-sm text-gray-500 hover:text-brand transition-colors"
        >
          ← 내 세미나
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-3 mb-4">
          {prefill ? "세미나 복제" : "새 세미나 등록"}
        </h1>
        {prefill && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
            기존 세미나를 복제했습니다. <strong>슬러그(URL)</strong>와 <strong>일정</strong>을 새로 입력한 뒤 등록하세요.
          </div>
        )}
        <TeacherSeminarForm
          mode="create"
          defaultSenderPhone={ctx.phone ?? null}
          initial={prefill ?? { instructorName: ctx.name ?? "" }}
        />
      </div>
    </div>
  );
}
