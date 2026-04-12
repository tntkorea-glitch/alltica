"use client";

import { useState, useEffect, useCallback } from "react";
import { Submission } from "@/lib/types";
import { formTemplates } from "@/lib/forms";
import Link from "next/link";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSlug, setFilterSlug] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");

  // Check cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/admin_auth=([^;]+)/);
    if (match && match[1] === "admin1234") {
      setAuthenticated(true);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const cookieMatch = document.cookie.match(/admin_auth=([^;]+)/);
      const pw = cookieMatch?.[1] || password;
      const url = `/api/submissions?password=${encodeURIComponent(pw)}${filterSlug ? `&formSlug=${filterSlug}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("인증 실패");
      const data = await res.json();
      setSubmissions(data);
    } catch {
      setError("데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [password, filterSlug]);

  useEffect(() => {
    if (authenticated) {
      fetchSubmissions();
    }
  }, [authenticated, filterSlug, fetchSubmissions]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin1234") {
      document.cookie = `admin_auth=${password}; path=/; max-age=${60 * 60 * 24}`;
      setAuthenticated(true);
      setError("");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_auth=; path=/; max-age=0";
    setAuthenticated(false);
    setPassword("");
    setSubmissions([]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 text-center mb-6">관리자 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] text-sm"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#16304f] transition-colors"
            >
              로그인
            </button>
          </form>
          <Link href="/" className="block text-center text-xs text-gray-400 mt-4 hover:text-gray-600">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-xs text-gray-500">접수된 신청서를 확인하고 관리합니다.</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <button
            onClick={() => setFilterSlug("")}
            className={`bg-white rounded-xl p-4 border text-left transition-colors ${
              filterSlug === "" ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/20" : "border-gray-100"
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            <p className="text-xs text-gray-500">전체</p>
          </button>
          {formTemplates.map((ft) => {
            const count = filterSlug === ""
              ? submissions.filter((s) => s.formSlug === ft.slug).length
              : ft.slug === filterSlug ? submissions.length : 0;
            return (
              <button
                key={ft.slug}
                onClick={() => setFilterSlug(filterSlug === ft.slug ? "" : ft.slug)}
                className={`bg-white rounded-xl p-4 border text-left transition-colors ${
                  filterSlug === ft.slug ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/20" : "border-gray-100"
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 truncate">{ft.icon} {ft.title}</p>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">
              신청 목록
              {filterSlug && (
                <span className="ml-2 text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">
                  {formTemplates.find((f) => f.slug === filterSlug)?.title}
                </span>
              )}
            </h2>
            <button
              onClick={fetchSubmissions}
              className="text-xs text-[#1e3a5f] hover:underline"
            >
              새로고침
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">접수된 신청서가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-6 py-3 font-medium">접수일시</th>
                    <th className="px-6 py-3 font-medium">유형</th>
                    <th className="px-6 py-3 font-medium">이름</th>
                    <th className="px-6 py-3 font-medium">연락처</th>
                    <th className="px-6 py-3 font-medium">이메일</th>
                    <th className="px-6 py-3 font-medium">파일</th>
                    <th className="px-6 py-3 font-medium">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap text-xs">
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-[#1e3a5f] px-2 py-1 rounded-full font-medium whitespace-nowrap">
                          {sub.formTitle}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {(sub.data.name as string) || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {(sub.data.phone as string) || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {(sub.data.email as string) || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {Object.keys(sub.files).length > 0 ? (
                          <span className="text-green-600 text-xs">
                            📎 {Object.keys(sub.files).length}개
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="text-[#1e3a5f] hover:underline text-xs font-medium"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900">{selectedSubmission.formTitle}</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedSubmission.submittedAt)}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {Object.entries(selectedSubmission.data).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium uppercase">{key}</span>
                  <span className="text-sm text-gray-900 mt-0.5">
                    {Array.isArray(value) ? value.join(", ") : (value || "-")}
                  </span>
                </div>
              ))}
              {Object.entries(selectedSubmission.files).length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium uppercase">첨부파일</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(selectedSubmission.files).map(([key, path]) => (
                      <a
                        key={key}
                        href={path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-[#1e3a5f] hover:underline"
                      >
                        📎 {path.split("/").pop()}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
