"use client";

import { useState } from "react";
import { Seminar } from "@/lib/seminars";
import SeminarCard from "@/components/SeminarCard";
import SeminarCalendar from "@/components/SeminarCalendar";

type View = "list" | "calendar";

export default function SeminarsView({ seminars }: { seminars: Seminar[] }) {
  const [view, setView] = useState<View>("list");

  const openOrUpcoming = seminars.filter(
    (s) => s.status === "open" || s.status === "upcoming",
  );
  const closed = seminars.filter(
    (s) => s.status === "closed" || s.status === "completed",
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
      {/* 뷰 토글 */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <div className="inline-flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
              view === "list"
                ? "bg-brand text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            목록
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors border-l border-gray-200 ${
              view === "calendar"
                ? "bg-brand text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            캘린더
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        /* 캘린더 뷰 — 전체 세미나 표시 */
        <SeminarCalendar seminars={seminars} />
      ) : (
        /* 목록 뷰 */
        <>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
            {openOrUpcoming.length === 0 ? (
              <p className="text-center text-gray-500 py-12">현재 모집 중인 세미나가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {openOrUpcoming.map((s) => (
                  <SeminarCard key={s.slug} seminar={s} />
                ))}
              </div>
            )}
          </div>

          {closed.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-bold text-gray-500 mb-4 px-1">지난 세미나</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-60">
                {closed.map((s) => (
                  <SeminarCard key={s.slug} seminar={s} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
