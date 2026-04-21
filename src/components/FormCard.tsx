import Link from "next/link";
import { FormTemplate } from "@/lib/types";

interface FormCardProps {
  form: FormTemplate;
  index: number;
}

export default function FormCard({ form, index }: FormCardProps) {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-orange-500 to-red-500",
    "from-cyan-500 to-blue-600",
  ];

  return (
    <Link
      href={`/forms/${form.slug}`}
      className="group block bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden hover:-translate-y-2"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${gradients[index % gradients.length]} transition-all duration-300 group-hover:h-2`} />

      <div className="p-6 sm:p-8">
        {/* Icon with gradient background */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <span className="drop-shadow-sm">{form.icon}</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand transition-colors">
          {form.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          {form.description}
        </p>

        {/* CTA */}
        <div className="flex items-center text-sm font-bold text-brand opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          신청하기
          <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
