"use client";

import { useState, useEffect, useCallback } from "react";

interface Competition { id: string; title: string; }

interface CompAward {
  id: string;
  competition_id: string;
  grade: string | null;
  award_name: string;
  count: number | null;
  percent: number | null;
  per_major_category: boolean;
  display_order: number;
}

interface ContestantResult {
  id: string;
  name: string;
  grade: string | null;
  company: string | null;
  number: number | null;
  category_name: string;
  major_category: string | null;
  raw_score: number | null;
  max_score: number;
  normalized_score: number | null;
  rank: number | null;
  award: string | null;
}

interface CompanyGroup {
  company: string;
  pro: ContestantResult[];
  student: ContestantResult[];
  other: ContestantResult[];
  awarded_count: number;
}

interface ResultsData {
  pro_results: ContestantResult[];
  student_results: ContestantResult[];
  other_results: ContestantResult[];
  by_company: CompanyGroup[];
  pro_awards: CompAward[];
  student_awards: CompAward[];
  total_pro: number;
  total_student: number;
}

type ViewTab = "전체" | "프로전문가부" | "학생부" | "종목별" | "단체별" | "특별상";
type DraftAward = { award_name?: string; count?: number | null; percent?: number | null; per_major_category?: boolean };

const AWARD_COLORS: Record<string, string> = {
  "월드MVP챔피언": "bg-purple-100 text-purple-800 border-purple-300",
  "월드마스터": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "월드그랑프리": "bg-blue-100 text-blue-700 border-blue-300",
  "그랑프리": "bg-teal-100 text-teal-700 border-teal-300",
  "대상": "bg-red-100 text-red-800 border-red-300",
  "금상": "bg-amber-100 text-amber-800 border-amber-300",
  "은상": "bg-gray-100 text-gray-700 border-gray-300",
  "동상": "bg-orange-100 text-orange-700 border-orange-300",
  "장려상": "bg-green-100 text-green-700 border-green-300",
};

function awardBadge(award: string | null) {
  if (!award) return null;
  const cls = AWARD_COLORS[award] ?? "bg-blue-100 text-blue-800 border-blue-300";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${cls}`}>
      {award}
    </span>
  );
}

const apiFetch = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error ?? res.statusText);
  }
  return res.json();
};

// ─── AwardRow (inline editable) ───────────────────────────────
function AwardRow({
  base, draft = {}, onDraftChange, onDelete,
}: {
  base: CompAward;
  draft?: DraftAward;
  onDraftChange: (id: string, changes: DraftAward) => void;
  onDelete: (id: string) => void;
}) {
  const merged = { ...base, ...draft };
  const mode: "대종목별" | "명수" | "퍼센트" = merged.per_major_category
    ? "대종목별"
    : merged.percent !== null
    ? "퍼센트"
    : "명수";

  const numVal = merged.per_major_category
    ? ""
    : merged.percent !== null
    ? String(merged.percent)
    : String(merged.count ?? 1);

  const setMode = (m: "대종목별" | "명수" | "퍼센트") => {
    if (m === "대종목별") onDraftChange(base.id, { per_major_category: true, count: 1, percent: null });
    else if (m === "퍼센트") onDraftChange(base.id, { per_major_category: false, percent: merged.percent ?? 10, count: null });
    else onDraftChange(base.id, { per_major_category: false, count: merged.count ?? 1, percent: null });
  };

  const setVal = (v: string) => {
    const n = parseFloat(v);
    if (mode === "퍼센트") onDraftChange(base.id, { percent: isNaN(n) ? null : n });
    else onDraftChange(base.id, { count: isNaN(n) ? 1 : Math.round(n) });
  };

  const isDirty = Object.keys(draft).length > 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${isDirty ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"}`}>
      <input
        value={merged.award_name}
        onChange={(e) => onDraftChange(base.id, { award_name: e.target.value })}
        className="flex-1 min-w-0 outline-none bg-transparent font-medium text-gray-800"
      />
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "대종목별" | "명수" | "퍼센트")}
        className="text-xs border rounded px-1 py-0.5 bg-gray-50 text-gray-700"
      >
        <option value="대종목별">대종목별 1명</option>
        <option value="명수">고정 명수</option>
        <option value="퍼센트">퍼센트(%)</option>
      </select>
      {mode !== "대종목별" && (
        <>
          <input
            value={numVal}
            onChange={(e) => setVal(e.target.value)}
            type="number" min="0" step={mode === "퍼센트" ? "0.1" : "1"}
            className="w-16 border rounded px-2 py-0.5 text-xs text-center"
          />
          <span className="text-xs text-gray-400">{mode === "퍼센트" ? "%" : "명"}</span>
        </>
      )}
      {isDirty && <span className="text-xs text-yellow-600 font-bold">*</span>}
      <button onClick={() => onDelete(base.id)} className="text-red-400 hover:text-red-600 text-sm ml-1" title="삭제">✕</button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function JudgeAwardsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [awardSettings, setAwardSettings] = useState<CompAward[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftAward>>({});
  const [results, setResults] = useState<ResultsData | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("전체");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingGrade, setAddingGrade] = useState<string | null>(null);
  const [newAwardName, setNewAwardName] = useState("");

  useEffect(() => {
    apiFetch("/api/judge/competitions").then(setCompetitions).catch(() => {});
    apiFetch("/api/judge/me").then((d: { isAdmin?: boolean }) => setIsAdmin(d.isAdmin ?? false)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  const loadAll = useCallback(async (comp: Competition) => {
    setLoading(true);
    setResults(null);
    try {
      const [res, awards] = await Promise.all([
        apiFetch(`/api/judge/competition-results?competition_id=${comp.id}`),
        apiFetch(`/api/judge/competition-awards?competition_id=${comp.id}`),
      ]);
      setResults(res as ResultsData);
      setAwardSettings(awards as CompAward[]);
      setDrafts({});
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedComp) loadAll(selectedComp);
    else { setResults(null); setAwardSettings([]); setDrafts({}); }
  }, [selectedComp, loadAll]);

  const handleSeed = async (grade: string) => {
    if (!selectedComp) return;
    if (!confirm(`IBC ${grade} 프리셋을 적용합니다.\n기존 ${grade} 시상 설정이 교체됩니다.`)) return;
    setSeeding(true);
    try {
      await apiFetch("/api/judge/competition-awards/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition_id: selectedComp.id, grade }),
      });
      await loadAll(selectedComp);
      setMsg(`✅ ${grade} IBC 프리셋 적용 완료`);
    } catch (e: unknown) { setMsg((e as Error).message); }
    setSeeding(false);
  };

  const handleDraftChange = (id: string, changes: DraftAward) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...changes } }));
  };

  const handleDeleteAward = async (id: string) => {
    if (!confirm("이 시상을 삭제합니다.")) return;
    try {
      await apiFetch("/api/judge/competition-awards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setAwardSettings((prev) => prev.filter((a) => a.id !== id));
      setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch (e: unknown) { setMsg((e as Error).message); }
  };

  const handleAddAward = async (grade: string) => {
    if (!selectedComp || !newAwardName.trim()) return;
    setSaving(true);
    try {
      const maxOrder = awardSettings.filter((a) => a.grade === grade).reduce((m, a) => Math.max(m, a.display_order), -1) + 1;
      const data = await apiFetch("/api/judge/competition-awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition_id: selectedComp.id, grade, award_name: newAwardName.trim(), count: 1, display_order: maxOrder }),
      });
      setAwardSettings((prev) => [...prev, data as CompAward]);
      setNewAwardName("");
      setAddingGrade(null);
    } catch (e: unknown) { setMsg((e as Error).message); }
    setSaving(false);
  };

  const handleSaveAndRefresh = async () => {
    if (!selectedComp) return;
    const dirty = Object.entries(drafts).filter(([, v]) => Object.keys(v).length > 0);
    setSaving(true);
    try {
      if (dirty.length > 0) {
        await Promise.all(
          dirty.map(([id, changes]) =>
            apiFetch("/api/judge/competition-awards", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, ...changes }),
            })
          )
        );
      }
      await loadAll(selectedComp);
      setMsg("✅ 변경사항 저장 및 결과 반영 완료");
    } catch (e: unknown) { setMsg((e as Error).message); }
    setSaving(false);
  };

  const proAwards = awardSettings.filter((a) => a.grade === "프로전문가부");
  const studentAwards = awardSettings.filter((a) => a.grade === "학생부");
  const hasDirty = Object.values(drafts).some((v) => Object.keys(v).length > 0);

  const renderRow = (r: ContestantResult, showGrade = true) => (
    <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50/20 transition-colors">
      <td className="px-3 py-2.5 text-center">
        {r.rank ? (
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
            ${r.rank === 1 ? "bg-yellow-400 text-yellow-900" : r.rank <= 3 ? "bg-slate-200 text-slate-700" : "bg-gray-100 text-gray-600"}`}>
            {r.rank}
          </span>
        ) : <span className="text-gray-300 text-xs">-</span>}
      </td>
      <td className="px-3 py-2.5 text-center text-xs text-gray-500">{r.number ?? "-"}</td>
      <td className="px-3 py-2.5 font-medium text-gray-800">{r.name}</td>
      <td className="px-3 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{r.major_category ?? "-"}</td>
      <td className="px-3 py-2.5 text-xs text-gray-500">{r.category_name}</td>
      {showGrade && (
        <td className="px-3 py-2.5 text-center hidden md:table-cell">
          {r.grade ? (
            <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium
              ${r.grade === "프로전문가부" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
              {r.grade === "프로전문가부" ? "프로" : "학생"}
            </span>
          ) : null}
        </td>
      )}
      <td className="px-3 py-2.5 text-center">
        {r.normalized_score !== null
          ? <span className="font-bold text-gray-800">{r.normalized_score.toFixed(1)}</span>
          : <span className="text-gray-300 text-xs">미집계</span>}
      </td>
      <td className="px-3 py-2.5 text-center">{awardBadge(r.award)}</td>
    </tr>
  );

  const tableHead = (showGrade = true) => (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-10">등수</th>
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-10">번호</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">이름</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">대종목</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">종목</th>
        {showGrade && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 hidden md:table-cell">부문</th>}
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">환산점수</th>
        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">시상</th>
      </tr>
    </thead>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏆 시상 결과</h1>
            <p className="text-sm text-gray-500 mt-0.5">채점 결과 기준 최종 시상 배분</p>
          </div>
          <div className="flex gap-2">
            <a href="/judge/admin" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              ← 관리 패널
            </a>
            <a href="/judge/result" className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200">
              종목별 결과
            </a>
          </div>
        </div>

        {msg && (
          <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">{msg}</div>
        )}

        {/* Competition selector */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          <select
            value={selectedComp?.id ?? ""}
            onChange={(e) => setSelectedComp(competitions.find((c) => c.id === e.target.value) ?? null)}
            className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm min-w-[200px]"
          >
            <option value="">대회 선택...</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {selectedComp && (
            <button onClick={() => loadAll(selectedComp)}
              className="px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              새로고침
            </button>
          )}
        </div>

        {!selectedComp && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🏆</div>
            <p>대회를 선택하면 시상 결과를 확인할 수 있습니다.</p>
          </div>
        )}

        {selectedComp && (
          <>
            {/* Admin settings panel */}
            {isAdmin && (
              <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">⚙️ 시상 설정</span>
                    <span className="text-xs text-gray-400">(관리자)</span>
                    {awardSettings.length > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                        프로 {proAwards.length}개 · 학생 {studentAwards.length}개
                      </span>
                    )}
                    {hasDirty && (
                      <span className="text-xs text-yellow-600 font-semibold">⚠ 미저장 변경</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">{settingsOpen ? "▲ 접기" : "▼ 펼치기"}</span>
                </button>

                {settingsOpen && (
                  <div className="border-t border-gray-100 px-5 py-5 space-y-6">
                    {/* Pro section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-blue-700">🔵 프로전문가부 시상</h3>
                        <button onClick={() => handleSeed("프로전문가부")} disabled={seeding}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                          {seeding ? "적용 중..." : "IBC 프리셋"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {proAwards.map((a) => (
                          <AwardRow key={a.id} base={a} draft={drafts[a.id]} onDraftChange={handleDraftChange} onDelete={handleDeleteAward} />
                        ))}
                        {proAwards.length === 0 && (
                          <p className="text-xs text-gray-400 py-2">시상 없음 — IBC 프리셋 적용 또는 직접 추가하세요.</p>
                        )}
                      </div>
                      {addingGrade === "프로전문가부" ? (
                        <div className="flex gap-2 mt-3">
                          <input value={newAwardName} onChange={(e) => setNewAwardName(e.target.value)}
                            placeholder="시상명 (예: 특별상)" className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && handleAddAward("프로전문가부")} autoFocus />
                          <button onClick={() => handleAddAward("프로전문가부")} disabled={saving}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">추가</button>
                          <button onClick={() => { setAddingGrade(null); setNewAwardName(""); }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">취소</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingGrade("프로전문가부")}
                          className="mt-2 text-xs text-blue-600 hover:underline">
                          + 직접 추가
                        </button>
                      )}
                    </div>

                    {/* Student section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-green-700">🟢 학생부 시상</h3>
                        <button onClick={() => handleSeed("학생부")} disabled={seeding}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
                          {seeding ? "적용 중..." : "IBC 프리셋"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {studentAwards.map((a) => (
                          <AwardRow key={a.id} base={a} draft={drafts[a.id]} onDraftChange={handleDraftChange} onDelete={handleDeleteAward} />
                        ))}
                        {studentAwards.length === 0 && (
                          <p className="text-xs text-gray-400 py-2">시상 없음 — IBC 프리셋 적용 또는 직접 추가하세요.</p>
                        )}
                      </div>
                      {addingGrade === "학생부" ? (
                        <div className="flex gap-2 mt-3">
                          <input value={newAwardName} onChange={(e) => setNewAwardName(e.target.value)}
                            placeholder="시상명 (예: 특별상)" className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && handleAddAward("학생부")} autoFocus />
                          <button onClick={() => handleAddAward("학생부")} disabled={saving}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">추가</button>
                          <button onClick={() => { setAddingGrade(null); setNewAwardName(""); }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">취소</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingGrade("학생부")}
                          className="mt-2 text-xs text-green-600 hover:underline">
                          + 직접 추가
                        </button>
                      )}
                    </div>

                    {/* Save / refresh button */}
                    <button
                      onClick={handleSaveAndRefresh}
                      disabled={saving}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50
                        ${hasDirty
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"}`}
                    >
                      {saving ? "처리 중..." : hasDirty ? "변경사항 저장 + 결과 반영" : "결과 새로고침"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p className="text-sm">집계 중...</p>
              </div>
            )}

            {!loading && results && (
              <>
                {/* Award legend */}
                {awardSettings.length > 0 && (
                  <div className="mb-4 flex gap-3 flex-wrap">
                    {[...proAwards, ...studentAwards].map((a) => {
                      const lbl = a.per_major_category
                        ? "대종목별 1명"
                        : a.percent !== null
                        ? `${a.percent}%`
                        : `${a.count}명`;
                      const icon = a.grade === "프로전문가부" ? "🔵" : "🟢";
                      return (
                        <div key={a.id} className="flex items-center gap-1">
                          {awardBadge(a.award_name)}
                          <span className="text-xs text-gray-400">{icon} {lbl}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* View tabs */}
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                  {(["전체", "프로전문가부", "학생부", "종목별", "단체별", "특별상"] as ViewTab[]).map((t) => {
                    const allCats = new Set([...results.pro_results, ...results.student_results].map(r => r.category_name));
                    // compute multi-category special award counts
                    const personMap = new Map<string, { grade: string | null; cats: Set<string> }>();
                    for (const r of [...results.pro_results, ...results.student_results]) {
                      const key = `${r.name}|${r.company ?? ""}|${r.grade ?? ""}`;
                      if (!personMap.has(key)) personMap.set(key, { grade: r.grade, cats: new Set() });
                      personMap.get(key)!.cats.add(r.category_name);
                    }
                    const specialCount = [...personMap.values()].filter(p => p.cats.size >= 3).length;
                    const cnt =
                      t === "전체" ? results.pro_results.length + results.student_results.length
                      : t === "프로전문가부" ? results.total_pro
                      : t === "학생부" ? results.total_student
                      : t === "종목별" ? allCats.size
                      : t === "특별상" ? specialCount
                      : results.by_company.length;
                    return (
                      <button key={t} onClick={() => setViewTab(t)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap
                          ${viewTab === t
                            ? "bg-blue-600 text-white shadow"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                        {t} <span className="opacity-70 text-xs">({cnt})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Results table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* 전체 */}
                  {viewTab === "전체" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        {tableHead(true)}
                        <tbody>
                          {results.pro_results.length + results.student_results.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-12 text-gray-400">
                                집계된 결과가 없습니다. 채점을 완료해주세요.
                              </td>
                            </tr>
                          ) : (
                            [...results.pro_results, ...results.student_results].map((r) => renderRow(r, true))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 프로전문가부 */}
                  {viewTab === "프로전문가부" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        {tableHead(false)}
                        <tbody>
                          {results.pro_results.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-gray-400">프로전문가부 결과가 없습니다.</td>
                            </tr>
                          ) : results.pro_results.map((r) => renderRow(r, false))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 학생부 */}
                  {viewTab === "학생부" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        {tableHead(false)}
                        <tbody>
                          {results.student_results.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-gray-400">학생부 결과가 없습니다.</td>
                            </tr>
                          ) : results.student_results.map((r) => renderRow(r, false))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 특별상 */}
                  {viewTab === "특별상" && (() => {
                    type PersonEntry = {
                      name: string;
                      grade: string | null;
                      company: string | null;
                      categories: string[];
                      catCount: number;
                      awards: string[];
                      bestScore: number | null;
                    };
                    const personMap = new Map<string, PersonEntry>();
                    for (const r of [...results.pro_results, ...results.student_results]) {
                      const key = `${r.name}|${r.company ?? ""}|${r.grade ?? ""}`;
                      if (!personMap.has(key)) {
                        personMap.set(key, { name: r.name, grade: r.grade, company: r.company, categories: [], catCount: 0, awards: [], bestScore: null });
                      }
                      const p = personMap.get(key)!;
                      if (!p.categories.includes(r.category_name)) {
                        p.categories.push(r.category_name);
                        p.catCount++;
                      }
                      if (r.award && !p.awards.includes(r.award)) p.awards.push(r.award);
                      if (r.normalized_score !== null && (p.bestScore === null || r.normalized_score > p.bestScore)) p.bestScore = r.normalized_score;
                    }
                    const allPersons = [...personMap.values()].filter(p => p.catCount >= 3);
                    const 최우수 = allPersons.filter(p => p.grade === "프로전문가부").sort((a,b) => b.catCount - a.catCount || (b.bestScore ?? 0) - (a.bestScore ?? 0));
                    const 우수 = allPersons.filter(p => p.grade === "학생부").sort((a,b) => b.catCount - a.catCount || (b.bestScore ?? 0) - (a.bestScore ?? 0));

                    const SpecialTable = ({ persons, title, color, awardName }: { persons: PersonEntry[]; title: string; color: string; awardName: string }) => (
                      <div className="px-4 py-5">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className={`text-sm font-bold ${color}`}>{title}</h3>
                          <span className="text-xs text-gray-400">3종목 이상 참가자 · {persons.length}명</span>
                          {awardBadge(awardName)}
                        </div>
                        {persons.length === 0 ? (
                          <p className="text-sm text-gray-400 py-4 text-center">해당 선수가 없습니다.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">이름</th>
                                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">단체</th>
                                  <th className="px-3 py-2.5 text-center font-semibold text-gray-500">참가종목수</th>
                                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">참가 종목</th>
                                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">획득 시상</th>
                                </tr>
                              </thead>
                              <tbody>
                                {persons.map((p, i) => (
                                  <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/20">
                                    <td className="px-3 py-2.5 font-semibold text-gray-900">{p.name}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500">{p.company ?? "-"}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${p.catCount >= 5 ? "bg-purple-100 text-purple-700" : p.catCount >= 4 ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>
                                        {p.catCount}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs text-gray-600">{p.categories.join(", ")}</td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex gap-1 flex-wrap">
                                        {p.awards.length > 0 ? p.awards.map(a => awardBadge(a)) : <span className="text-gray-300 text-xs">-</span>}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <div className="divide-y divide-gray-100">
                        <SpecialTable persons={최우수} title="🏅 최우수선수상 (프로전문가부 · 3종목 이상)" color="text-blue-700" awardName="최우수선수상" />
                        <SpecialTable persons={우수} title="🌟 우수선수상 (학생부 · 3종목 이상)" color="text-green-700" awardName="우수선수상" />
                      </div>
                    );
                  })()}

                  {/* 종목별 */}
                  {viewTab === "종목별" && (() => {
                    const proAwardNames = proAwards.map(a => a.award_name);
                    const studentAwardNames = studentAwards.map(a => a.award_name);

                    // Build category summary: category_name → { major, grade, counts per award }
                    type CatSummaryRow = {
                      major_category: string | null;
                      category_name: string;
                      grade: string;
                      counts: Record<string, number>;
                      total_contestants: number;
                      total_awarded: number;
                      items: ContestantResult[];
                    };

                    const buildSummary = (contestants: ContestantResult[], awardNames: string[], gradeLabel: string): CatSummaryRow[] => {
                      const map = new Map<string, CatSummaryRow>();
                      for (const c of contestants) {
                        if (!map.has(c.category_name)) {
                          map.set(c.category_name, {
                            major_category: c.major_category,
                            category_name: c.category_name,
                            grade: gradeLabel,
                            counts: Object.fromEntries(awardNames.map(n => [n, 0])),
                            total_contestants: 0,
                            total_awarded: 0,
                            items: [],
                          });
                        }
                        const row = map.get(c.category_name)!;
                        row.total_contestants++;
                        row.items.push(c);
                        if (c.award && awardNames.includes(c.award)) {
                          row.counts[c.award]++;
                          row.total_awarded++;
                        }
                      }
                      return [...map.values()].sort((a, b) =>
                        (a.major_category ?? "").localeCompare(b.major_category ?? "", "ko") ||
                        a.category_name.localeCompare(b.category_name, "ko")
                      );
                    };

                    const proSummary = buildSummary(results.pro_results, proAwardNames, "프로전문가부");
                    const studentSummary = buildSummary(results.student_results, studentAwardNames, "학생부");

                    const SummaryTable = ({ rows, awardNames, gradeColor }: { rows: CatSummaryRow[]; awardNames: string[]; gradeColor: string }) => (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-3 py-2.5 text-left font-semibold text-gray-500">대종목</th>
                              <th className="px-3 py-2.5 text-left font-semibold text-gray-500">종목</th>
                              <th className="px-3 py-2.5 text-center font-semibold text-gray-500">참가</th>
                              {awardNames.map(n => (
                                <th key={n} className="px-2 py-2.5 text-center font-semibold text-gray-500 whitespace-nowrap">
                                  {awardBadge(n)}
                                </th>
                              ))}
                              <th className="px-3 py-2.5 text-center font-semibold text-gray-500">수상계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(row => (
                              <tr key={row.category_name} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-500">{row.major_category ?? "-"}</td>
                                <td className="px-3 py-2 font-medium text-gray-800">{row.category_name}</td>
                                <td className="px-3 py-2 text-center text-gray-600">{row.total_contestants}</td>
                                {awardNames.map(n => (
                                  <td key={n} className="px-2 py-2 text-center">
                                    {row.counts[n] > 0
                                      ? <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${gradeColor}`}>{row.counts[n]}</span>
                                      : <span className="text-gray-200">-</span>}
                                  </td>
                                ))}
                                <td className="px-3 py-2 text-center font-semibold text-gray-700">{row.total_awarded || "-"}</td>
                              </tr>
                            ))}
                            {/* Total row */}
                            <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                              <td className="px-3 py-2 text-gray-600" colSpan={2}>합계 ({rows.length}개 종목)</td>
                              <td className="px-3 py-2 text-center text-gray-700">{rows.reduce((s,r) => s+r.total_contestants, 0)}</td>
                              {awardNames.map(n => {
                                const total = rows.reduce((s,r) => s+(r.counts[n]||0), 0);
                                return <td key={n} className="px-2 py-2 text-center text-gray-700">{total || "-"}</td>;
                              })}
                              <td className="px-3 py-2 text-center text-gray-700">{rows.reduce((s,r) => s+r.total_awarded, 0)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );

                    // Per-category pro/student count overview
                    type CatGradeRow = { major: string | null; name: string; pro: number; student: number; total: number };
                    const catGradeMap = new Map<string, CatGradeRow>();
                    for (const r of [...results.pro_results, ...results.student_results]) {
                      if (!catGradeMap.has(r.category_name)) catGradeMap.set(r.category_name, { major: r.major_category, name: r.category_name, pro: 0, student: 0, total: 0 });
                      const row = catGradeMap.get(r.category_name)!;
                      if (r.grade === "프로전문가부") row.pro++;
                      else if (r.grade === "학생부") row.student++;
                      row.total++;
                    }
                    const catGradeRows = [...catGradeMap.values()].sort((a, b) =>
                      (a.major ?? "").localeCompare(b.major ?? "", "ko") || a.name.localeCompare(b.name, "ko")
                    );

                    return (
                      <div className="divide-y divide-gray-100">
                        {/* 종목별 프로/학생 인원 현황 */}
                        <div className="px-4 py-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 종목별 부문 인원 현황</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">대종목</th>
                                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">종목</th>
                                  <th className="px-3 py-2.5 text-center font-semibold text-blue-600">프로전문가부</th>
                                  <th className="px-3 py-2.5 text-center font-semibold text-green-600">학생부</th>
                                  <th className="px-3 py-2.5 text-center font-semibold text-gray-600">합계</th>
                                </tr>
                              </thead>
                              <tbody>
                                {catGradeRows.map(row => (
                                  <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-400">{row.major ?? "-"}</td>
                                    <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                                    <td className="px-3 py-2 text-center">
                                      {row.pro > 0 ? <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-semibold">{row.pro}명</span> : <span className="text-gray-200">-</span>}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {row.student > 0 ? <span className="inline-block bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-semibold">{row.student}명</span> : <span className="text-gray-200">-</span>}
                                    </td>
                                    <td className="px-3 py-2 text-center font-semibold text-gray-700">{row.total}명</td>
                                  </tr>
                                ))}
                                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-xs">
                                  <td className="px-3 py-2 text-gray-600" colSpan={2}>합계 ({catGradeRows.length}개 종목)</td>
                                  <td className="px-3 py-2 text-center text-blue-700">{catGradeRows.reduce((s, r) => s + r.pro, 0)}명</td>
                                  <td className="px-3 py-2 text-center text-green-700">{catGradeRows.reduce((s, r) => s + r.student, 0)}명</td>
                                  <td className="px-3 py-2 text-center text-gray-700">{catGradeRows.reduce((s, r) => s + r.total, 0)}명</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pro summary table */}
                        {proSummary.length > 0 && (
                          <div className="px-4 py-4">
                            <h3 className="text-sm font-semibold text-blue-700 mb-3">🔵 프로전문가부 종목별 시상 현황</h3>
                            <SummaryTable rows={proSummary} awardNames={proAwardNames} gradeColor="bg-blue-100 text-blue-700" />
                          </div>
                        )}

                        {/* Student summary table */}
                        {studentSummary.length > 0 && (
                          <div className="px-4 py-4">
                            <h3 className="text-sm font-semibold text-green-700 mb-3">🟢 학생부 종목별 시상 현황</h3>
                            <SummaryTable rows={studentSummary} awardNames={studentAwardNames} gradeColor="bg-green-100 text-green-700" />
                          </div>
                        )}

                        {/* Detailed per-category list */}
                        {[...proSummary, ...studentSummary].map(row => (
                          <div key={`${row.grade}-${row.category_name}`} className="px-5 py-4">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <span className="text-xs text-gray-400">{row.major_category}</span>
                              <h3 className="font-semibold text-gray-900">{row.category_name}</h3>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border ${row.grade === "프로전문가부" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                                {row.grade === "프로전문가부" ? "프로" : "학생"}
                              </span>
                              <span className="text-xs text-gray-400">{row.total_contestants}명</span>
                              {row.total_awarded > 0 && (
                                <span className="text-xs text-purple-600 font-medium bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                  수상 {row.total_awarded}명
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {row.items.map(c => (
                                <div key={c.id} className="flex items-center gap-3 text-sm flex-wrap">
                                  <span className="text-gray-400 text-xs w-8 text-right">{c.rank ?? "-"}<span className="text-gray-300">위</span></span>
                                  <span className="text-gray-400 text-xs w-12 text-right">{c.number ?? ""}</span>
                                  <span className={`font-medium ${c.award ? "text-gray-900" : "text-gray-500"}`}>{c.name}</span>
                                  {c.normalized_score !== null && (
                                    <span className="text-xs text-gray-400">{c.normalized_score.toFixed(1)}점</span>
                                  )}
                                  {awardBadge(c.award)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {proSummary.length === 0 && studentSummary.length === 0 && (
                          <div className="text-center py-12 text-gray-400 text-sm">집계된 결과가 없습니다.</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 단체별 */}
                  {viewTab === "단체별" && (() => {
                    // Build per-person special award map (3종목+)
                    const specialMap = new Map<string, "최우수선수상" | "우수선수상">();
                    const personCatMap = new Map<string, { grade: string | null; cats: Set<string> }>();
                    for (const r of [...results.pro_results, ...results.student_results]) {
                      const key = `${r.name}|${r.company ?? ""}|${r.grade ?? ""}`;
                      if (!personCatMap.has(key)) personCatMap.set(key, { grade: r.grade, cats: new Set() });
                      personCatMap.get(key)!.cats.add(r.category_name);
                    }
                    for (const [key, p] of personCatMap) {
                      if (p.cats.size >= 3) {
                        specialMap.set(key, p.grade === "프로전문가부" ? "최우수선수상" : "우수선수상");
                      }
                    }

                    return (
                      <div className="divide-y divide-gray-100">
                        {results.by_company.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 text-sm">
                            단체 정보가 없습니다. 선수 등록 시 단체명을 입력해주세요.
                          </div>
                        ) : (
                          results.by_company.map((group) => {
                            const all = [...group.pro, ...group.student, ...group.other];
                            const specialInGroup = all.filter(c => specialMap.has(`${c.name}|${c.company ?? ""}|${c.grade ?? ""}`));
                            return (
                              <div key={group.company} className="px-5 py-4">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <h3 className="font-semibold text-gray-900">{group.company}</h3>
                                  <span className="text-xs text-gray-400">{all.length}명 참가</span>
                                  {group.awarded_count > 0 && (
                                    <span className="text-xs text-purple-700 font-medium bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                      수상 {group.awarded_count}명
                                    </span>
                                  )}
                                  {specialInGroup.length > 0 && (
                                    <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                      🌟 특별상 {specialInGroup.length}명
                                    </span>
                                  )}
                                </div>
                                {/* Special award highlight */}
                                {specialInGroup.length > 0 && (
                                  <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="text-xs font-semibold text-amber-700 mb-1.5">특별상 수상자</div>
                                    <div className="flex flex-wrap gap-2">
                                      {specialInGroup.map(c => {
                                        const specKey = `${c.name}|${c.company ?? ""}|${c.grade ?? ""}`;
                                        const specAward = specialMap.get(specKey)!;
                                        return (
                                          <div key={c.id + "-special"} className="flex items-center gap-1.5 text-xs">
                                            <span className="font-semibold text-gray-900">{c.name}</span>
                                            {awardBadge(specAward)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  {all.map((c) => {
                                    const specKey = `${c.name}|${c.company ?? ""}|${c.grade ?? ""}`;
                                    const specAward = specialMap.get(specKey);
                                    return (
                                      <div key={c.id} className="flex items-center gap-3 text-sm flex-wrap">
                                        <span className="text-gray-400 text-xs w-6 text-right">{c.number ?? ""}</span>
                                        <span className={`font-medium ${c.award || specAward ? "text-gray-900" : "text-gray-600"}`}>{c.name}</span>
                                        {c.grade && (
                                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                            c.grade === "프로전문가부"
                                              ? "bg-blue-50 text-blue-600 border-blue-200"
                                              : "bg-green-50 text-green-600 border-green-200"
                                          }`}>
                                            {c.grade === "프로전문가부" ? "프로" : "학생"}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-400">{c.category_name}</span>
                                        {c.normalized_score !== null && (
                                          <span className="text-xs text-gray-400">{c.normalized_score.toFixed(1)}점</span>
                                        )}
                                        {awardBadge(c.award)}
                                        {specAward && awardBadge(specAward)}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
