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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b2d] via-[#1e3a5f] to-[#2a5080]" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto pt-28 pb-14 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-blue-200/70 hover:text-white transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">{form.icon}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{form.title}</h1>
          </div>
          <p className="text-blue-100/70 text-sm sm:text-base ml-0 sm:ml-[calc(2.5rem+1rem)]">
            {form.description}
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
          <FormRenderer form={form} />
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다
        </p>
      </div>
    </div>
  );
}
