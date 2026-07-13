"use client";

import { useState, useEffect, useCallback } from "react";

interface Competition { id: string; title: string; }
interface Category { id: string; name: string; competition_id: string; }
interface Criterion { id: string; name: string; max_score: number; }
interface CriterionScore { criterion_id: string; criterion_name: string; max_score: number; avg: number | null; judge_count: number; }
interface ResultRow { id: string; name: string; phone?: string; criteria_scores: CriterionScore[]; total: number | null; rank: number | null; award: string | null; }
interface Award { id: string; award_name: string; count: number | null; }

const api = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? res.statusText); }
  return res.json();
};

const AWARD_COLORS: Record<string, string> = {
  "금상": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "은상": "bg-gray-100 text-gray-700 border-gray-300",
  "동상": "bg-orange-100 text-orange-700 border-orange-300",
  "장려상": "bg-green-100 text-green-700 border-green-300",
  "대상": "bg-red-100 text-red-800 border-red-300",
  "월드MVP챔피언": "bg-purple-100 text-purple-800 border-purple-300",
};

function awardBadgeClass(award: string | null) {
  if (!award) return "";
  return AWARD_COLORS[award] ?? "bg-blue-100 text-blue-800 border-blue-300";
}

export default function JudgeResultPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [submittedJudgeCount, setSubmittedJudgeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/judge/competitions").then(setCompetitions).catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedCompetition) return setCategories([]);
    api(`/api/judge/categories?competition_id=${selectedCompetition.id}`).then(setCategories).catch(() => { });
  }, [selectedCompetition]);

  const loadResults = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const data = await api(`/api/judge/results?category_id=${selectedCategory.id}`);
      setResults(data.results);
      setCriteria(data.criteria);
      setAwards(data.awards);
      setSubmittedJudgeCount(data.submitted_judge_count);
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => { loadResults(); }, [loadResults]);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(""), 4000); return () => clearTimeout(t); } }, [msg]);

  const exportCSV = () => {
    if (!results.length) return;
    const header = ["순위", "이름", "전화번호", ...criteria.map((c) => `${c.name}(${c.max_score}점)`), "총점", "시상"];
    const rows = results.map((r) => [
      r.rank ?? "-",
      r.name,
      r.phone ?? "",
      ...r.criteria_scores.map((cs) => cs.avg !== null ? cs.avg.toFixed(2) : "-"),
      r.total !== null ? r.total.toFixed(2) : "-",
      r.award ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `결과_${selectedCategory?.name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 채점 결과</h1>
            <p className="text-sm text-gray-500 mt-0.5">심사위원 점수 합산 · 자동 등수 산출</p>
          </div>
          <a href="/judge/admin" className="text-sm text-blue-600 hover:underline">← 관리 패널</a>
        </div>

        {msg && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">{msg}</div>}

        {/* 필터 */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select value={selectedCompetition?.id ?? ""} onChange={(e) => { const c = competitions.find((x) => x.id === e.target.value) ?? null; setSelectedCompetition(c); setSelectedCategory(null); setResults([]); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">대회 선택</option>
            {competitions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={selectedCategory?.id ?? ""} onChange={(e) => { const c = categories.find((x) => x.id === e.target.value) ?? null; setSelectedCategory(c); }} disabled={!selectedCompetition} className="border rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-50">
            <option value="">종목 선택</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCategory && (
            <button onClick={loadResults} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">새로고침</button>
          )}
          {results.length > 0 && (
            <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">CSV 내보내기</button>
          )}
        </div>

        {selectedCategory && (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-gray-600">제출 완료 심사위원: <strong>{submittedJudgeCount}명</strong></span>
            {awards.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {awards.map((a) => <span key={a.id} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${awardBadgeClass(a.award_name)}`}>{a.award_name} {a.count}명</span>)}
              </div>
            )}
          </div>
        )}

        {loading && <div className="text-center py-12 text-gray-400">집계 중...</div>}

        {!loading && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full bg-white border rounded-xl text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-12">순위</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">선수</th>
                  {criteria.map((c) => (
                    <th key={c.id} className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">{c.name}<br /><span className="font-normal text-gray-400 text-xs">/{c.max_score}</span></th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">총점</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">시상</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className={`border-b last:border-0 ${r.award ? "bg-yellow-50/30" : ""}`}>
                    <td className="px-4 py-3 font-bold text-gray-700">{r.rank ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{r.name}</span>
                      {r.phone && <span className="text-xs text-gray-400 block">{r.phone}</span>}
                    </td>
                    {r.criteria_scores.map((cs) => (
                      <td key={cs.criterion_id} className="px-4 py-3 text-center">
                        {cs.avg !== null ? <span className="font-semibold text-blue-600">{cs.avg.toFixed(1)}</span> : <span className="text-gray-300">-</span>}
                        {cs.judge_count > 0 && <span className="text-gray-300 text-xs block">({cs.judge_count}명)</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-lg text-gray-900">
                      {r.total !== null ? r.total.toFixed(1) : <span className="text-gray-300 text-sm">미집계</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.award ? <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${awardBadgeClass(r.award)}`}>{r.award}</span> : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && selectedCategory && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">아직 집계할 채점 데이터가 없습니다.</div>
        )}

        {!selectedCategory && (
          <div className="text-center py-12 text-gray-400">대회와 종목을 선택하면 결과가 표시됩니다.</div>
        )}
      </div>
    </div>
  );
}
