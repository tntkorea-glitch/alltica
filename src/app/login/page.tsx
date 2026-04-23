"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-deep via-brand to-[#1a365d] px-4 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            로그인
          </h1>
          <p className="text-sm text-gray-500">
            Alltica 계정으로 로그인하세요
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </button>

          <button
            type="button"
            onClick={() =>
              alert("카카오 로그인은 준비 중입니다. Google 로그인을 이용해 주세요.")
            }
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#FEE500] rounded-2xl text-sm font-semibold text-[#3C1E1E] hover:bg-[#F5DC00] transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.29 4.71 6.71-.21.78-.77 2.83-.88 3.27-.14.55.2.54.42.39.17-.12 2.71-1.84 3.81-2.58.62.09 1.26.14 1.94.14 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            카카오로 계속하기
          </button>

          <button
            type="button"
            onClick={() =>
              alert("네이버 로그인은 준비 중입니다. Google 로그인을 이용해 주세요.")
            }
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#03C75A] rounded-2xl text-sm font-semibold text-white hover:bg-[#02b351] transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845Z" />
            </svg>
            네이버로 계속하기
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8 leading-relaxed">
          로그인 시 Alltica의 서비스 이용약관 및
          <br />
          개인정보처리방침에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
