"use client";

import { useState } from "react";

export default function FloatingContact() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {expanded && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-72 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-900 text-sm">카카오톡 상담</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            궁금한 점이 있으시면 편하게 연락주세요!
          </p>
          <a
            href="tel:010-8842-5659"
            className="flex items-center justify-center gap-2 w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-3 px-4 rounded-xl text-sm hover:bg-[#F5DC00] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.29 4.71 6.71-.21.78-.77 2.83-.88 3.27-.14.55.2.54.42.39.17-.12 2.71-1.84 3.81-2.58.62.09 1.26.14 1.94.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            </svg>
            010-8842-5659
          </a>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-[#FEE500] text-[#3C1E1E] w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="카카오톡 상담"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.29 4.71 6.71-.21.78-.77 2.83-.88 3.27-.14.55.2.54.42.39.17-.12 2.71-1.84 3.81-2.58.62.09 1.26.14 1.94.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
        </svg>
      </button>
    </div>
  );
}
