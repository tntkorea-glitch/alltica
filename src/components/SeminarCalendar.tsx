"use client";

import { useState } from "react";
import Link from "next/link";
import { Seminar } from "@/lib/seminars";

function seminarColor(s: Seminar) {
  if (s.tags.includes("KBA") || s.tags.includes("문화센터")) {
    return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
  }
  return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export default function SeminarCalendar({ seminars }: { seminars: Seminar[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이 달에 start_at이 있는 세미나 → day 매핑
  const dayMap = new Map<number, Seminar[]>();
  for (const s of seminars) {
    const d = new Date(s.startAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(s);
    }
  }

  // 달력 셀 배열 (null = 빈 칸)
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayDay = now.getDate();
  const isNow = now.getFullYear() === year && now.getMonth() === month;

  // 이 달에 세미나가 있는지 여부 (헤더 배지용)
  const hasAny = dayMap.size > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <button
          onClick={prev}
          className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          aria-label="이전 달"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-gray-900">{year}년 {month + 1}월</span>
          {hasAny && (
            <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
              {[...dayMap.values()].reduce((a, b) => a + b.length, 0)}개 일정
            </span>
          )}
        </div>
        <button
          onClick={next}
          className="p-2 rounded-xl hover:bg-gray-200/60 transition-colors"
          aria-label="다음 달"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`text-center py-2.5 text-xs font-bold tracking-wide ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-500" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="divide-y divide-gray-50/80">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-50/80">
            {week.map((day, di) => {
              const seminarsOnDay = day ? (dayMap.get(day) ?? []) : [];
              const isToday = isNow && day === todayDay;
              const isEmpty = day === null;
              return (
                <div
                  key={di}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 ${
                    isEmpty
                      ? "bg-gray-50/40"
                      : seminarsOnDay.length > 0
                      ? "bg-white"
                      : "bg-white hover:bg-gray-50/50 transition-colors"
                  }`}
                >
                  {day !== null && (
                    <>
                      <div className="flex justify-start mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full font-semibold ${
                            isToday
                              ? "bg-brand text-white font-extrabold"
                              : di === 0
                              ? "text-red-400"
                              : di === 6
                              ? "text-blue-500"
                              : "text-gray-600"
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {seminarsOnDay.slice(0, 3).map((s) => (
                          <Link
                            key={s.id}
                            href={`/seminars/${s.slug}`}
                            className={`block text-[10px] leading-snug px-1.5 py-0.5 rounded border truncate font-medium transition-colors ${seminarColor(s)}`}
                            title={s.title}
                          >
                            {/* 모바일: 아이콘만, sm 이상: 제목 */}
                            <span className="hidden sm:inline">
                              {s.title.length > 10 ? s.title.slice(0, 10) + "…" : s.title}
                            </span>
                            <span className="sm:hidden">
                              {s.tags.includes("KBA") ? "🌸" : "📌"}
                            </span>
                          </Link>
                        ))}
                        {seminarsOnDay.length > 3 && (
                          <p className="text-[10px] text-gray-400 pl-1 font-medium">
                            +{seminarsOnDay.length - 3}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 inline-block shrink-0" />
          postica 세미나
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200 inline-block shrink-0" />
          KBA 문화센터 강좌
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block shrink-0" />
          오늘
        </div>
      </div>
    </div>
  );
}
