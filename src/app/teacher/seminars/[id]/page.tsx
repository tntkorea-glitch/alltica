import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherContext } from "@/lib/teacher-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import TeacherSeminarForm from "@/components/TeacherSeminarForm";

export const dynamic = "force-dynamic";

function isoForDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditSeminarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getTeacherContext();
  if (!ctx) redirect(`/login?callbackUrl=/teacher/seminars/${id}`);

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("seminars")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();
  if (ctx.role !== "admin" && row.instructor_id !== ctx.userId) {
    redirect("/teacher");
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
        <div className="flex items-end justify-between gap-4 mt-3 mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">세미나 수정</h1>
          <Link
            href={`/teacher/seminars/${id}/applicants`}
            className="text-sm text-brand font-semibold hover:underline"
          >
            신청자 보기 →
          </Link>
        </div>
        <TeacherSeminarForm
          mode="edit"
          defaultSenderPhone={ctx.phone ?? null}
          initial={{
            id: row.id,
            slug: row.slug,
            title: row.title,
            subtitle: row.subtitle ?? "",
            dateDisplay: row.date_display,
            startAt: isoForDatetimeLocal(row.start_at),
            endAt: row.end_at ? isoForDatetimeLocal(row.end_at) : "",
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
            status: row.status,
          }}
        />
      </div>
    </div>
  );
}
