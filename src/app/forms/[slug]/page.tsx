import { notFound } from "next/navigation";
import { getFormBySlug, formTemplates } from "@/lib/forms";
import FormRenderer from "@/components/FormRenderer";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return formTemplates.map((form) => ({ slug: form.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const form = getFormBySlug(slug);
  if (!form) return { title: "페이지를 찾을 수 없습니다" };
  return {
    title: `${form.title} | 통합 신청센터`,
    description: form.description,
  };
}

export default async function FormPage({ params }: PageProps) {
  const { slug } = await params;
  const form = getFormBySlug(slug);

  if (!form) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Form Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2a5080] text-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{form.icon}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{form.title}</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base">{form.description}</p>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-10">
          <FormRenderer form={form} />
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다.
        </p>
      </div>
    </div>
  );
}
