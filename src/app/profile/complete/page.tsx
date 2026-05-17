"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function ProfileCompletePage() {
  return (
    <Suspense fallback={null}>
      <ProfileCompleteInner />
    </Suspense>
  );
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function ProfileCompleteInner() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedPhone = phone.replace(/[^0-9]/g, "");
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (trimmedPhone.length < 10) { setError("올바른 연락처를 입력해주세요."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: trimmedPhone, businessName: businessName.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "저장 실패"); return; }
      // 세션 갱신 후 이동
      await update({ phone: trimmedPhone, name: name.trim() });
      router.replace(callbackUrl);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-deep via-brand to-[#1a365d] px-4 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👤</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            프로필을 완성해주세요
          </h1>
          <p className="text-sm text-gray-500">
            서비스 이용을 위해 이름과 연락처가 필요합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="010-0000-0000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              상호명 <span className="text-xs font-normal text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="예: 홍길동헤어샵"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand text-white font-bold rounded-2xl text-sm hover:bg-brand-light transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "저장 중..." : "완료하기"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          입력하신 정보는 서비스 이용 및 대회 신청 안내에만 사용됩니다
        </p>
      </div>
    </div>
  );
}
