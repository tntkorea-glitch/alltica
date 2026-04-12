import Link from "next/link";
import { FormTemplate } from "@/lib/types";

interface FormCardProps {
  form: FormTemplate;
}

export default function FormCard({ form }: FormCardProps) {
  return (
    <Link
      href={`/forms/${form.slug}`}
      className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#1e3a5f]/20 overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="text-4xl mb-4">{form.icon}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1e3a5f] transition-colors">
          {form.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {form.description}
        </p>
        <div className="flex items-center text-sm font-semibold text-[#1e3a5f] group-hover:translate-x-1 transition-transform">
          신청하기
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
