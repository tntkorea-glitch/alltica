import Link from "next/link";
import { Seminar, formatPrice } from "@/lib/seminars";

const statusStyle: Record<Seminar["status"], { label: string; tone: string }> = {
  open: { label: "모집 중", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  upcoming: { label: "오픈 예정", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  closed: { label: "마감", tone: "bg-gray-100 text-gray-500 border-gray-200" },
  completed: { label: "종료", tone: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function SeminarCard({ seminar }: { seminar: Seminar }) {
  const status = statusStyle[seminar.status];

  return (
    <Link
      href={`/seminars/${seminar.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${status.tone}`}>
          {status.label}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {seminar.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug group-hover:text-brand transition-colors">
        {seminar.title}
      </h3>
      {seminar.subtitle && (
        <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{seminar.subtitle}</p>
      )}

      <div className="space-y-1.5 text-sm text-gray-600 border-t border-gray-100 pt-4">
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">일시</span>
          <span className="text-gray-700">{seminar.dateDisplay}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">장소</span>
          <span className="text-gray-700">{seminar.location}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-14 shrink-0">강사</span>
          <span className="text-gray-700">{seminar.instructor}</span>
        </div>
      </div>

      <div className="flex items-end justify-between mt-5 pt-4 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">참가비</div>
          <div className="text-xl font-extrabold text-brand">{formatPrice(seminar.price)}</div>
        </div>
        <span className="text-sm font-semibold text-brand group-hover:translate-x-1 transition-transform">
          상세보기 →
        </span>
      </div>
    </Link>
  );
}
