"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const POPUP_KEY = "ibc_judge_notice_dismissed";

export default function JudgeNoticePopup({ judgeName, judgeTitle, categories }: { judgeName: string; judgeTitle: string; categories: string[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(POPUP_KEY);
    if (!dismissed) setOpen(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(POPUP_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
          <div className="text-2xl mb-2">⚖️</div>
          <h2 className="text-lg font-bold">심사위원 안내</h2>
          <p className="text-blue-100 text-sm mt-1">제 12회 IBC 국제뷰티스트챔피언십 in 2026</p>
        </div>

        {/* 내용 */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-800 font-semibold">
            {judgeName} {categories[0] ?? ""} {judgeTitle}님,
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            온라인 심사 시스템에 오신 것을 환영합니다.<br />
            아래 배정 종목을 확인하시고 심사를 진행해주세요.
          </p>

          {categories.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">배정 종목</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <span key={c} className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition"
          >
            나중에
          </button>
          <Link
            href="/judge"
            onClick={dismiss}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl text-center hover:bg-blue-700 transition"
          >
            심사 시작하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
