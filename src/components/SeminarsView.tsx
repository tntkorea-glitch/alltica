"use client";

import { useState } from "react";
import { Seminar } from "@/lib/seminars";
import SeminarCard from "@/components/SeminarCard";
import SeminarCalendar from "@/components/SeminarCalendar";

type View = "list" | "calendar";

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
          view === "list" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        목록
      </button>
      <button
        onClick={() => onChange("calendar")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
          view === "calendar" ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        캘린더
      </button>
    </div>
  );
}

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
      {/* 메인 카드 — 토글 포함 */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        {/* 카드 헤더: 타이틀 + 토글 */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-500">
            {view === "list"
              ? `모집중 ${openOrUpcoming.length}개`
              : "전체 일정 캘린더"}
          </p>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* 카드 바디 */}
        <div className="p-6 sm:p-8">
          {view === "calendar" ? (
            <SeminarCalendar seminars={seminars} />
          ) : openOrUpcoming.length === 0 ? (
            <p className="text-center text-gray-500 py-12">현재 모집 중인 세미나가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {openOrUpcoming.map((s) => (
                <SeminarCard key={s.slug} seminar={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 지난 세미나 (목록 뷰에서만) */}
      {view === "list" && closed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold text-gray-500 mb-4 px-1">지난 세미나</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-60">
            {closed.map((s) => (
              <SeminarCard key={s.slug} seminar={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
