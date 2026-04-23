import { redirect } from "next/navigation";
import Link from "next/link";
import { getTeacherContext } from "@/lib/teacher-auth";
import TeacherSeminarForm from "@/components/TeacherSeminarForm";

export const dynamic = "force-dynamic";

export default async function NewSeminarPage() {
  const ctx = await getTeacherContext();
  if (!ctx) redirect("/login?callbackUrl=/teacher/seminars/new");

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/teacher"
          className="text-sm text-gray-500 hover:text-brand transition-colors"
        >
          ← 내 세미나
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-3 mb-6">새 세미나 등록</h1>
        <TeacherSeminarForm
          mode="create"
          defaultSenderPhone={ctx.phone ?? null}
          initial={{ instructorName: ctx.name ?? "" }}
        />
      </div>
    </div>
  );
}
