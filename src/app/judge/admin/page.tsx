"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORY_HIERARCHY, normalizeMajorLabel } from "@/lib/judge-categories";
import { resolveCategory } from "@/lib/judge-category-matcher";

// ─── Types ───────────────────────────────────────────────────
interface Competition { id: string; title: string; description?: string; date_display?: string; status: string; contest_slug?: string; }
interface Category { id: string; competition_id: string; name: string; display_order: number; major_category?: string; }
interface Contestant { id: string; category_id: string; name: string; phone?: string; email?: string; company?: string; grade?: string; number?: number; display_order: number; paid?: boolean; contestant_files?: ContestantFile[]; }
interface ContestantFile { id: string; contestant_id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
interface Criterion { id: string; category_id: string; name: string; max_score: number; display_order: number; }
interface Assignment { id: string; user_id: string; category_id: string; title?: string; judge_name?: string; users: { email: string; name?: string; }; }
interface Award { id: string; category_id: string; award_name: string; count: number | null; display_order: number; }

interface DetectedContest { slug: string; title: string; counts: Record<string, number>; }
interface ImportAthlete { id: string; name: string; phone: string; email: string; grade: string; company: string; divisions: string[]; }
interface ImportJudge { id: string; name: string; phone: string; email: string; title: string; categories: string[]; career: string; }

type Tab = "competitions" | "contestants" | "judges" | "criteria" | "awards";

const TABS: { key: Tab; label: string }[] = [
  { key: "competitions", label: "대회·종목" },
  { key: "contestants", label: "선수·파일" },
  { key: "judges", label: "심사위원 배정" },
  { key: "criteria", label: "채점 항목" },
  { key: "awards", label: "시상 설정" },
];

const JUDGE_TITLES = ["수석심사위원", "심사위원", "글로벌심사위원", "운영위원장", "심사위원장"];

// ─── Helpers ──────────────────────────────────────────────────
const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error ?? "오류 발생"); }
  return res.json();
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─── CompetitionsTab ─────────────────────────────────────────
function CompetitionsTab({
  competitions, categories, selectedCompetition, selectedCategory,
  onSelectCompetition, onSelectCategory, onRefresh,
}: {
  competitions: Competition[];
  categories: Category[];
  selectedCompetition: Competition | null;
  selectedCategory: Category | null;
  onSelectCompetition: (c: Competition | null) => void;
  onSelectCategory: (c: Category | null) => void;
  onRefresh: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatMajor, setNewCatMajor] = useState(CATEGORY_HIERARCHY[0]?.major ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [detected, setDetected] = useState<DetectedContest[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importCategories, setImportCategories] = useState<string[]>([]);
  const [showCatImport, setShowCatImport] = useState(false);

  const loadDetected = async () => {
    try { const data = await api("/api/judge/import?action=detect"); setDetected(data); setShowImport(true); }
    catch (e: unknown) { setMsg((e as Error).message); }
  };

  const importCompetition = async (c: DetectedContest) => {
    setLoading(true);
    try {
      await api("/api/judge/competitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: c.title, contest_slug: c.slug, status: "open" }) });
      setShowImport(false); setMsg(`"${c.title}" 가져오기 완료`); onRefresh();
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  };

  const addCompetition = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await api("/api/judge/competitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle.trim(), date_display: newDate }) });
      setNewTitle(""); setNewDate(""); setMsg("대회가 추가됐습니다."); onRefresh();
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  };

  const deleteCompetition = async (id: string) => {
    if (!confirm("대회를 삭제하면 종목·선수·파일 모두 삭제됩니다. 계속하시겠습니까?")) return;
    try { await api(`/api/judge/competitions/${id}`, { method: "DELETE" }); onSelectCompetition(null); onRefresh(); }
    catch (e: unknown) { setMsg((e as Error).message); }
  };

  const loadImportCategories = async () => {
    if (!selectedCompetition?.contest_slug) { setMsg("신청서와 연결된 대회가 아닙니다."); return; }
    try {
      const data = await api(`/api/judge/import?action=data&contest_slug=${selectedCompetition.contest_slug}`);
      setImportCategories(data.categories);
      setShowCatImport(true);
    } catch (e: unknown) { setMsg((e as Error).message); }
  };

  const importCategory = async (name: string) => {
    if (!selectedCompetition) return;
    if (categories.some((c) => c.name === name)) { setMsg(`"${name}"은 이미 등록됐습니다.`); return; }
    try {
      await api("/api/judge/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: selectedCompetition.id, name, display_order: categories.length }) });
      onRefresh();
    } catch (e: unknown) { setMsg((e as Error).message); }
  };

  const importAllCategories = async () => {
    if (!selectedCompetition) return;
    setLoading(true);
    let added = 0;
    for (const name of importCategories) {
      if (!categories.some((c) => c.name === name)) {
        // CATEGORY_HIERARCHY에서 major_category 자동 매핑
        const group = CATEGORY_HIERARCHY.find((g) => g.subs.includes(name));
        try {
          await api("/api/judge/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: selectedCompetition.id, name, major_category: group?.major ?? null, display_order: categories.length + added }) });
          added++;
        } catch { /* skip */ }
      }
    }
    setMsg(`종목 ${added}개 추가됐습니다.`); onRefresh(); setShowCatImport(false);
    setLoading(false);
  };

  const bulkCreateCategories = async () => {
    if (!selectedCompetition) return;
    if (!confirm("CATEGORY_HIERARCHY의 모든 세부종목을 대종목 포함해 일괄 생성합니다. 이미 있는 종목은 건너뜁니다.")) return;
    setLoading(true);
    try {
      const result = await api("/api/judge/categories/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: selectedCompetition.id }) });
      setMsg(`종목 ${result.added}개 일괄 생성됐습니다.`); onRefresh();
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  };

  const addCategory = async () => {
    if (!selectedCompetition || !newCatName.trim()) return;
    setLoading(true);
    try {
      await api("/api/judge/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: selectedCompetition.id, name: newCatName.trim(), major_category: newCatMajor || null, display_order: categories.length }) });
      setNewCatName(""); setMsg("종목이 추가됐습니다."); onRefresh();
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("종목을 삭제하면 선수·채점·배정 데이터가 모두 삭제됩니다.")) return;
    try { await api(`/api/judge/categories/${id}`, { method: "DELETE" }); onSelectCategory(null); onRefresh(); }
    catch (e: unknown) { setMsg((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      {msg && <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-4 py-2">{msg}</p>}

      {/* 대회 목록 */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">대회 목록</h3>
          <button onClick={loadDetected} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
            📋 신청서에서 불러오기
          </button>
        </div>

        {showImport && (
          <div className="mb-4 border border-green-200 rounded-xl bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800 mb-3">신청서에서 감지된 대회:</p>
            <div className="space-y-2">
              {detected.map((d) => (
                <div key={d.slug} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{d.title}</p>
                    <p className="text-xs text-gray-400">선수 {d.counts.athlete ?? 0}명 · 심사위원 {d.counts.judge ?? 0}명 · 조직위 {d.counts.committee ?? 0}명</p>
                  </div>
                  <button onClick={() => importCompetition(d)} disabled={loading} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">
                    가져오기
                  </button>
                </div>
              ))}
              {detected.length === 0 && <p className="text-sm text-gray-400">감지된 대회가 없습니다.</p>}
            </div>
            <button onClick={() => setShowImport(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">닫기</button>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {competitions.map((c) => (
            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${selectedCompetition?.id === c.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => { onSelectCompetition(c); onSelectCategory(null); }}>
              <div>
                <span className="font-medium text-gray-900">{c.title}</span>
                {c.date_display && <span className="text-xs text-gray-400 ml-2">{c.date_display}</span>}
                {c.contest_slug && <span className="text-xs text-green-600 ml-2">📋 신청서 연결됨</span>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteCompetition(c.id); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">삭제</button>
            </div>
          ))}
          {competitions.length === 0 && <p className="text-sm text-gray-400">등록된 대회가 없습니다.</p>}
        </div>

        <div className="flex gap-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="대회명 (직접 입력)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCompetition()} />
          <input value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="날짜" className="w-36 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={addCompetition} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
        </div>
      </div>

      {/* 종목 목록 */}
      {selectedCompetition && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800">종목 — {selectedCompetition.title}</h3>
            <div className="flex gap-2">
              <button onClick={bulkCreateCategories} disabled={loading} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50">
                📁 전체 종목 일괄 생성
              </button>
              {selectedCompetition.contest_slug && (
                <button onClick={loadImportCategories} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                  📋 신청서에서 추가
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">대종목 클릭 → 세부종목 선택 · 심사위원은 대종목 단위로 배정</p>

          {showCatImport && (
            <div className="mb-4 border border-green-200 rounded-xl bg-green-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-800">신청서에서 감지된 종목 ({importCategories.length}개):</p>
                <button onClick={importAllCategories} disabled={loading} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">전체 추가</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {importCategories.map((name) => {
                  const exists = categories.some((c) => c.name === name);
                  const group = CATEGORY_HIERARCHY.find((g) => g.subs.includes(name));
                  return (
                    <div key={name} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border ${exists ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-800 border-gray-300"}`}>
                      {group && <span className="text-gray-400">[{group.major}]</span>}
                      <span className="max-w-[200px] truncate">{name}</span>
                      {exists ? <span className="text-green-600">✓</span> : <button onClick={() => importCategory(name)} className="text-blue-600 hover:text-blue-800 font-medium ml-1">+ 추가</button>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowCatImport(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">닫기</button>
            </div>
          )}

          {/* 대종목별 그룹 표시 */}
          <div className="space-y-4 mb-4">
            {(() => {
              // 1) CATEGORY_HIERARCHY 순서대로 그룹핑
              const grouped: { major: string; cats: Category[] }[] = [];
              for (const group of CATEGORY_HIERARCHY) {
                const cats = categories.filter((c) => c.major_category === group.major);
                if (cats.length > 0) grouped.push({ major: group.major, cats });
              }
              // 2) major_category 없는 것 (기존 데이터 또는 직접 추가)
              const ungrouped = categories.filter((c) => !c.major_category);
              if (ungrouped.length > 0) grouped.push({ major: "기타 (대종목 미지정)", cats: ungrouped });

              if (grouped.length === 0) return <p className="text-sm text-gray-400">등록된 종목이 없습니다. 전체 종목 일괄 생성 버튼을 눌러주세요.</p>;

              return grouped.map(({ major, cats }) => (
                <div key={major}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-0.5">대종목 {major}</span>
                    <span className="text-xs text-gray-400">{cats.length}개 세부종목</span>
                  </div>
                  <div className="space-y-1 ml-3">
                    {cats.map((cat) => (
                      <div key={cat.id} className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${selectedCategory?.id === cat.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                        onClick={() => onSelectCategory(cat)}>
                        <span className="text-sm text-gray-800">{cat.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">삭제</button>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* 직접 추가 */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">세부종목 직접 추가</p>
            <div className="flex gap-2">
              <select value={newCatMajor} onChange={(e) => setNewCatMajor(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
                {CATEGORY_HIERARCHY.map((g) => <option key={g.major} value={g.major}>{g.major}</option>)}
              </select>
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="세부종목명" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
              <button onClick={addCategory} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ContestantsTab ───────────────────────────────────────────
function ContestantsTab({ category, competition, categories, onMsg }: { category: Category | null; competition: Competition | null; categories: Category[]; onMsg: (m: string) => void }) {
  const [allContestants, setAllContestants] = useState<(Contestant & { category_name?: string })[]>([]);
  const [filterCatId, setFilterCatId] = useState<string>(""); // "" = 전체
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ytInputId, setYtInputId] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [editCompany, setEditCompany] = useState<{ id: string; value: string } | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // 신청서 import state
  const [importAthletes, setImportAthletes] = useState<ImportAthlete[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [allDivisions, setAllDivisions] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<"category" | "athlete" | "company">("category");
  const [companySortMode, setCompanySortMode] = useState<"name" | "input">("input");
  const [companyNotes, setCompanyNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("judge_company_notes") ?? "{}"); } catch { return {}; }
  });
  const setCompanyNote = (company: string, note: string) => {
    const next = note.trim() ? { ...companyNotes, [company]: note.trim() } : (({ [company]: _, ...rest }) => rest)(companyNotes);
    setCompanyNotes(next);
    localStorage.setItem("judge_company_notes", JSON.stringify(next));
  };

  // 필터 적용한 선수 목록
  const contestants = filterCatId
    ? allContestants.filter((c) => c.category_id === filterCatId)
    : allContestants;

  const load = useCallback(async () => {
    if (!competition) return;
    try {
      const data = await api(`/api/judge/contestants?competition_id=${competition.id}`);
      setAllContestants(data);
    } catch { /* ignore */ }
  }, [competition]);

  useEffect(() => { load(); }, [load]);

  // 종목 탭 선택 시 필터 동기화
  useEffect(() => {
    if (category) setFilterCatId(category.id);
    else setFilterCatId("");
  }, [category]);

  const loadImportAthletes = async () => {
    if (!competition?.contest_slug) { onMsg("신청서와 연결된 대회가 아닙니다."); return; }
    try {
      const data = await api(`/api/judge/import?action=data&contest_slug=${competition.contest_slug}`);
      setImportAthletes(data.athletes);
      setAllDivisions(data.categories);
      // 기본 매핑: 이름이 일치하는 카테고리 자동 연결
      const map: Record<string, string> = {};
      for (const div of data.categories as string[]) {
        const matched = categories.find((c) => c.name === div || div.startsWith(c.name) || c.name.startsWith(div.split(" ")[0]));
        if (matched) map[div] = matched.id;
      }
      setCatMap(map);
      setSelectedAthletes(new Set(data.athletes.map((a: ImportAthlete) => a.id)));
      setShowImport(true);
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  // data-file 폴더 불러오기
  const [dataFiles, setDataFiles] = useState<Array<{ filename: string; rows: Array<{ name: string; phone: string; company: string; grade: string; division: string }>; divisions: string[] }>>([]);
  const [showDataFile, setShowDataFile] = useState(false);
  const [dataFileCatMap, setDataFileCatMap] = useState<Record<string, string>>({});
  const [fallbackToCurrent, setFallbackToCurrent] = useState(true);

  const bulkImportDataFiles = async () => {
    const allRows = dataFiles.flatMap((f) => f.rows);
    if (allRows.length === 0) { onMsg("불러올 선수가 없습니다."); return; }
    setLoading(true);
    try {
      const result = await api("/api/judge/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "excel-rows",
          rows: allRows,
          category_map: dataFileCatMap,
          fallback_category_id: fallbackToCurrent && category ? category.id : undefined,
        }),
      });
      onMsg(`단체접수 파일에서 선수 ${result.inserted}명 등록 완료${result.skipped > 0 ? ` (종목미매핑 ${result.skipped}건)` : ""}${result.skipped_dup > 0 ? ` (중복 ${result.skipped_dup}명 제외)` : ""}`);
      setShowDataFile(false);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const bulkImport = async () => {
    const selected = importAthletes.filter((a) => selectedAthletes.has(a.id));
    if (selected.length === 0) { onMsg("선택된 선수가 없습니다."); return; }
    // 매핑된 선수 / 미매핑 선수 분리해서 미리 보여주기
    const willRegister = selected.filter((a) => a.divisions.some((d) => catMap[d]) || (fallbackToCurrent && category));
    if (willRegister.length === 0) { onMsg("등록될 선수가 없습니다. 종목 매핑을 확인하거나 '미매핑 → 현재 종목' 옵션을 켜세요."); return; }
    setLoading(true);
    try {
      const result = await api("/api/judge/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "athletes",
          category_map: catMap,
          fallback_category_id: fallbackToCurrent && category ? category.id : undefined,
          athletes: selected,
        }),
      });
      onMsg(`선수 ${result.inserted}명 등록 완료${result.skipped_dup > 0 ? ` (중복 ${result.skipped_dup}명 제외)` : ""}`);
      setShowImport(false);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  // 엑셀 업로드 (IBC 서식 자동 감지)
  const handleExcel = async (file: File) => {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const sheetName = wb.SheetNames.find((n) => n.includes("선수")) ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { defval: "", header: 1 });

      // IBC 서식 감지: 순번(col[0])이 숫자이거나, col[0] 비어있어도 col[1]에 이름이 있으면 단체접수 서식으로 간주
      const firstDataRow = rawRows[10];
      const isIBCFormat = rawRows.length > 10 && (
        typeof firstDataRow?.[0] === "number" ||
        (String(firstDataRow?.[0] ?? "").trim() === "" && String(firstDataRow?.[1] ?? "").trim().length > 0)
      );

      if (isIBCFormat) {
        // IBC 단체접수 서식 — 단체명은 헤더 영역에서 추출
        const isRealCompany = (v: string) => !!v && !/^\d+층?$/.test(v) && v.length > 1;
        let headerCompany = "";
        for (let i = 0; i < Math.min(9, rawRows.length); i++) {
          const hRow = rawRows[i];
          for (let j = 0; j < hRow.length; j++) {
            const cell = String(hRow[j] ?? "").trim();
            if (cell.includes("단체") && (cell.includes("기관명") || cell.includes("기관") || cell.includes("상호"))) {
              for (let k = j + 1; k < hRow.length; k++) {
                const val = String(hRow[k] ?? "").trim();
                if (isRealCompany(val)) { headerCompany = val; break; }
              }
            }
            if (headerCompany) break;
          }
          if (headerCompany) break;
        }

        const excelRows: Array<{ name: string; phone: string; company: string; grade: string; division: string }> = [];
        for (let i = 10; i < rawRows.length; i++) {
          const row = rawRows[i];
          // 순번(col[0])이 있으면 숫자인지 확인, 없으면 이름(col[1])으로 유효 행 판단
          const hasSeq = String(row[0] ?? "").trim() !== "";
          if (hasSeq && isNaN(Number(row[0]))) continue;
          const name = String(row[1] ?? "").trim();
          if (!name) continue;
          // col[10]=세부종목(표준 IBC 11열 서식), col[7]=참가종목(콤마 압축 서식)
          const divisionRaw = String(row[10] ?? "").trim() || String(row[7] ?? "").trim();
          if (!divisionRaw) continue;
          const divisionList = divisionRaw.split(",").map((d) => d.trim()).filter(Boolean);
          const rawCompany = String(row[2] ?? "").trim();
          const company = isRealCompany(rawCompany) ? rawCompany : headerCompany;
          for (const division of divisionList) {
            excelRows.push({ name, phone: String(row[5] ?? "").trim(), company, grade: String(row[8] ?? "").trim(), division });
          }
        }
        const divs = [...new Set(excelRows.map((r) => r.division))];
        const map: Record<string, string> = {};
        for (const div of divs) {
          const resolved = resolveCategory(div, categories);
          if (resolved) map[div] = resolved;
        }
        // 즉시 등록 대신 매핑 UI 표시
        setDataFiles([{ filename: file.name, rows: excelRows, divisions: divs }]);
        setDataFileCatMap(map);
        setShowDataFile(true);
        setLoading(false);
        return;
      } else {
        // 일반 서식
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        if (rows.length === 0) { onMsg("엑셀 데이터가 없습니다."); setLoading(false); return; }
        const nameKey = Object.keys(rows[0]).find((k) => /이름|name/i.test(k)) ?? "";
        const phoneKey = Object.keys(rows[0]).find((k) => /연락처|phone|tel/i.test(k)) ?? "";
        if (!nameKey) { onMsg("엑셀에서 이름 컬럼을 찾을 수 없습니다."); setLoading(false); return; }
        for (const row of rows) {
          const name = String(row[nameKey] ?? "").trim();
          if (!name) continue;
          await api("/api/judge/contestants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: filterCatId || category?.id, name, phone: phoneKey ? String(row[phoneKey] ?? "") : "" }) });
        }
        onMsg(`엑셀에서 선수 ${rows.filter((r) => r[nameKey]).length}명 등록 완료`);
      }
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const addContestant = async () => {
    if (!filterCatId || !newName.trim()) return;
    setLoading(true);
    try {
      await api("/api/judge/contestants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: filterCatId, name: newName.trim(), phone: newPhone.trim() }) });
      setNewName(""); setNewPhone(""); await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const deleteContestant = async (id: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm("선수를 삭제하시겠습니까?")) return;
    try { await api(`/api/judge/contestants/${id}`, { method: "DELETE" }); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  const deduplicateContestants = async () => {
    if (!competition) return;
    if (!confirm("이름+연락처+종목이 동일한 중복 선수를 자동 삭제하고 번호를 재정렬합니다. 계속하시겠습니까?")) return;
    setLoading(true);
    try {
      const result = await api("/api/judge/contestants/dedup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: competition.id }) });
      onMsg(result.deleted > 0 ? `✅ 중복 선수 ${result.deleted}명 삭제 완료 (번호 재정렬됨)` : "중복 선수가 없습니다.");
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const renumberContestants = async () => {
    // 대종목별 100단위 오프셋: SMP→101~, 속눈썹→201~, 피부→501~ (CATEGORY_HIERARCHY 순서)
    const preview = CATEGORY_HIERARCHY
      .map((g, i) => {
        const cnt = allContestants.filter((c) => categories.find((cat) => cat.id === c.category_id)?.major_category === g.major).length;
        return cnt > 0 ? `${g.major}: ${(i + 1) * 100 + 1}~` : null;
      })
      .filter(Boolean)
      .join(", ");
    if (!confirm(`대종목별 100단위로 참가번호를 자동 부여합니다.\n${preview}\n계속하시겠습니까?`)) return;
    setLoading(true);
    try {
      let updated = 0;
      for (let majorIdx = 0; majorIdx < CATEGORY_HIERARCHY.length; majorIdx++) {
        const g = CATEGORY_HIERARCHY[majorIdx];
        const offset = (majorIdx + 1) * 100;
        // 이 대종목에 속한 세부종목 (display_order 오름차순)
        const majorCats = categories
          .filter((c) => c.major_category === g.major)
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        let seq = 1;
        for (const cat of majorCats) {
          const rows = allContestants
            .filter((c) => c.category_id === cat.id)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          for (const c of rows) {
            const newNum = offset + seq;
            if (c.number !== newNum) {
              await api(`/api/judge/contestants/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: newNum }) });
              updated++;
            }
            seq++;
          }
        }
      }
      onMsg(`참가번호 ${updated}건 업데이트 완료 (대종목별 100단위)`);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const saveCompany = async (id: string, value: string) => {
    try {
      await api(`/api/judge/contestants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: value }) });
      setEditCompany(null);
      setAllContestants((prev) => prev.map((c) => c.id === id ? { ...c, company: value } : c));
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  const moveContestant = async (id: string, newCategoryId: string) => {
    if (!newCategoryId) return;
    const newCat = categories.find((c) => c.id === newCategoryId);
    try {
      await api(`/api/judge/contestants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: newCategoryId }) });
      setMovingId(null);
      setAllContestants((prev) => prev.map((c) => c.id === id ? { ...c, category_id: newCategoryId, category_name: newCat?.name } : c));
      onMsg(`종목 변경 완료 → ${newCat?.name}`);
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  const calcFeeNum = (grade: string | undefined, count: number): number => {
    if (count === 0) return 0;
    const isStudent = grade?.includes("학생");
    const table = isStudent ? [4, 7, 10] : [10, 18, 26];
    const perExtra = isStudent ? 3 : 8;
    return count <= 3 ? table[count - 1] : table[2] + (count - 3) * perExtra;
  };

  const calcFee = (grade: string | undefined, count: number): string => {
    const fee = calcFeeNum(grade, count);
    return fee === 0 ? "" : `${fee}만원`;
  };

  const togglePaid = async (id: string, current: boolean) => {
    try {
      await api(`/api/judge/contestants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: !current }) });
      setAllContestants((prev) => prev.map((c) => c.id === id ? { ...c, paid: !current } : c));
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  const uploadFile = async (contestantId: string, file: File) => {
    setUploading(contestantId);
    try {
      const { signedUrl, path } = await api("/api/judge/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contestantId, fileName: file.name, fileType: file.type }) });
      const uploadRes = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("파일 업로드 실패");
      await api("/api/judge/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contestant_id: contestantId, storage_path: path, file_name: file.name, file_type: file.type }) });
      await load(); onMsg(`${file.name} 업로드 완료`);
    } catch (e: unknown) { onMsg((e as Error).message); }
    setUploading(null);
  };

  const deleteFile = async (fileId: string, storagePath: string | null) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    try { await api("/api/judge/files", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: fileId, storage_path: storagePath }) }); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  const addYouTubeUrl = async (contestantId: string) => {
    const videoId = getYouTubeId(ytUrl.trim());
    if (!videoId) { onMsg("유효한 YouTube URL을 입력하세요"); return; }
    try {
      await api("/api/judge/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contestant_id: contestantId, video_url: ytUrl.trim(), file_name: `YouTube_${videoId}`, file_type: "youtube" }) });
      setYtUrl(""); setYtInputId(null); await load(); onMsg("YouTube URL이 등록됐습니다.");
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  // 미매핑 선수 수 계산
  const unmappedCount = importAthletes.filter((a) => selectedAthletes.has(a.id) && !a.divisions.some((d) => catMap[d])).length;

  if (!competition) return <p className="text-sm text-gray-400 text-center py-8">대회·종목 탭에서 대회를 먼저 선택하세요.</p>;

  return (
    <div className="space-y-4">
      {/* 종목 필터 탭 — 대종목/세부종목 표 */}
      {categories.length > 0 && (() => {
        const majorGroups = CATEGORY_HIERARCHY.map((g) => ({
          major: g.major,
          cats: categories.filter((c) => c.major_category === g.major),
        })).filter((g) => g.cats.length > 0);
        const ungrouped = categories.filter((c) => !c.major_category || !CATEGORY_HIERARCHY.find((g) => g.major === c.major_category));
        return (
          <div className="border rounded-xl overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b bg-blue-50">
                  <td className="px-3 py-1.5 font-bold text-blue-800 whitespace-nowrap w-20 border-r bg-blue-100">전체</td>
                  <td className="px-3 py-1.5">
                    {(() => {
                      const uniquePersons = new Set(allContestants.map(c => `${c.name}||${(c.phone ?? "").replace(/\D/g, "")}`)).size;
                      const proCount = allContestants.filter(c => !c.grade?.includes("학생")).length;
                      const studentCount = allContestants.filter(c => c.grade?.includes("학생")).length;
                      return (
                        <button
                          onClick={() => setFilterCatId("")}
                          className={`px-2.5 py-1 rounded-md font-medium transition ${filterCatId === "" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                        >
                          전체 {uniquePersons}명 · 전체 {allContestants.length}종목
                          <span className={`ml-1.5 text-xs ${filterCatId === "" ? "text-blue-200" : "text-gray-400"}`}>
                            (프로전문가부 {proCount}종목, 학생부 {studentCount}종목)
                          </span>
                        </button>
                      );
                    })()}
                  </td>
                </tr>
                {majorGroups.map((g, gi) => (
                  <tr key={g.major} className={`border-b ${gi % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="px-3 py-1.5 font-semibold text-gray-700 whitespace-nowrap border-r bg-gray-100 align-top">{g.major}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {g.cats.map((cat) => {
                          const cnt = allContestants.filter((c) => c.category_id === cat.id).length;
                          return (
                            <button key={cat.id} onClick={() => setFilterCatId(cat.id)}
                              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${filterCatId === cat.id ? "bg-blue-600 text-white" : cnt > 0 ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}>
                              {cat.name} {cnt > 0 ? `(${cnt})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {ungrouped.length > 0 && (
                  <tr className="bg-gray-50">
                    <td className="px-3 py-1.5 font-semibold text-gray-500 whitespace-nowrap border-r bg-gray-100">기타</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {ungrouped.map((cat) => {
                          const cnt = allContestants.filter((c) => c.category_id === cat.id).length;
                          return (
                            <button key={cat.id} onClick={() => setFilterCatId(cat.id)}
                              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${filterCatId === cat.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                              {cat.name} ({cnt})
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 액션 버튼들 */}
      <div className="flex gap-2 flex-wrap items-center">
        {competition?.contest_slug && (
          <button onClick={loadImportAthletes} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            📋 신청서에서 불러오기
          </button>
        )}
        <label className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 cursor-pointer">
          📁 단체접수 파일
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcel(f); e.target.value = ""; }} />
        </label>
        {allContestants.length > 0 && (<>
          <button onClick={deduplicateContestants} disabled={loading} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 disabled:opacity-50 border border-orange-300">
            🔄 중복 자동 삭제
          </button>
          <button onClick={renumberContestants} disabled={loading} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50 border border-blue-300">
            🔢 참가번호 자동 부여
          </button>
        </>)}
        {/* 보기 모드 토글 */}
        <div className="ml-auto flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button onClick={() => setViewMode("category")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === "category" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            종목별
          </button>
          <button onClick={() => setViewMode("athlete")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === "athlete" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            선수별
          </button>
          <button onClick={() => setViewMode("company")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === "company" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            단체별
          </button>
        </div>
        {viewMode === "company" && (() => {
          // 단체별 총 예상 수금액: 각 단체 총액 × 메모% 합산
          const companyMap2 = new Map<string, { grade?: string; count: number }>();
          for (const c of allContestants) {
            const co = c.company?.trim() || "(단체명 없음)";
            if (!companyMap2.has(co)) companyMap2.set(co, { grade: c.grade, count: 0 });
            companyMap2.get(co)!.count += 1;
          }
          // 단체별 총액 계산 (선수별 grade 혼재 시 대표값 사용)
          const personGradeMap = new Map<string, Map<string, { grade?: string; cnt: number }>>();
          for (const c of allContestants) {
            const co = c.company?.trim() || "(단체명 없음)";
            const pk = `${c.name}||${(c.phone ?? "").replace(/\D/g, "")}`;
            if (!personGradeMap.has(co)) personGradeMap.set(co, new Map());
            const pm = personGradeMap.get(co)!;
            if (!pm.has(pk)) pm.set(pk, { grade: c.grade, cnt: 0 });
            pm.get(pk)!.cnt += 1;
          }
          let grandTotal = 0;
          for (const [co, persons] of personGradeMap) {
            const note = companyNotes[co];
            if (!note) continue;
            const rate = parseFloat(note.replace("%", "")) / 100;
            if (isNaN(rate)) continue;
            const coFee = [...persons.values()].reduce((s, p) => s + calcFeeNum(p.grade, p.cnt), 0);
            grandTotal += Math.round(coFee * rate);
          }
          return (
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                <button onClick={() => setCompanySortMode("input")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${companySortMode === "input" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>입력순</button>
                <button onClick={() => setCompanySortMode("name")} className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${companySortMode === "name" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>이름순</button>
              </div>
              {(() => {
                const totalPersons = [...personGradeMap.values()].reduce((s, pm) => s + pm.size, 0);
                const totalEntries = allContestants.length;
                return (
                  <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                    전체 <span className="font-bold text-gray-700">{totalPersons}명</span> · <span className="font-bold text-gray-700">{totalEntries}건</span>
                    {grandTotal > 0 && <span className="ml-2 font-bold text-emerald-700">· 예상 수금 {grandTotal}만원</span>}
                  </span>
                );
              })()}
            </div>
          );
        })()}
      </div>

      {/* data-file 폴더 Import UI */}
      {showDataFile && (
        <div className="border border-purple-200 rounded-xl bg-purple-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-purple-800">단체접수 파일: {dataFiles[0]?.filename ?? ""} (총 {dataFiles.reduce((s, f) => s + f.rows.length, 0)}명)</p>
            <button onClick={() => setShowDataFile(false)} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
          </div>

          {/* 종목 매핑 */}
          <div className="mb-3 bg-white rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">세부종목 → 등록 종목 매핑:</p>
            {[...new Set(dataFiles.flatMap((f) => f.divisions))].sort().map((div) => (
              <div key={div} className={`flex items-center gap-2 text-xs rounded px-1 py-0.5 ${dataFileCatMap[div] ? "bg-green-50" : "bg-red-50"}`}>
                <span className="flex-1 text-gray-700 truncate">{div}</span>
                <span className="text-gray-400">→</span>
                <select value={dataFileCatMap[div] ?? ""} onChange={(e) => setDataFileCatMap((m) => ({ ...m, [div]: e.target.value }))} className="border rounded px-2 py-1 text-xs min-w-[180px]">
                  <option value="">등록 안 함</option>
                  {CATEGORY_HIERARCHY.map((group) => {
                    const groupCats = categories.filter((c) => group.subs.includes(c.name));
                    if (groupCats.length === 0) return null;
                    return (
                      <optgroup key={group.major} label={group.major}>
                        {groupCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                    );
                  })}
                  {/* 계층 미분류 종목 */}
                  {(() => {
                    const allSubNames = CATEGORY_HIERARCHY.flatMap((g) => g.subs);
                    const uncategorized = categories.filter((c) => !allSubNames.includes(c.name));
                    if (uncategorized.length === 0) return null;
                    return (
                      <optgroup label="기타">
                        {uncategorized.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                    );
                  })()}
                </select>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-purple-800 mb-3 cursor-pointer">
            <input type="checkbox" checked={fallbackToCurrent} onChange={(e) => setFallbackToCurrent(e.target.checked)} className="accent-purple-600" />
            매핑 안 된 종목도 현재 선택 종목({category?.name ?? "미선택"})에 등록
          </label>

          {dataFiles.map((f) => (
            <div key={f.filename} className="mb-2 text-xs bg-white rounded-lg px-3 py-2 border">
              <span className="font-medium text-gray-800">{f.filename}</span>
              <span className="text-gray-400 ml-2">{f.rows.length}명</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {f.rows.slice(0, 5).map((r, i) => <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{r.name}</span>)}
                {f.rows.length > 5 && <span className="text-gray-400">+{f.rows.length - 5}명</span>}
              </div>
            </div>
          ))}

          <button onClick={bulkImportDataFiles} disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 mt-2">
            {loading ? "등록 중..." : `전체 ${dataFiles.reduce((s, f) => s + f.rows.length, 0)}행 등록`}
          </button>
        </div>
      )}

      {/* 신청서 Import UI */}
      {showImport && (
        <div className="border border-green-200 rounded-xl bg-green-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-800">신청서 선수 목록 ({importAthletes.length}명)</p>
            <button onClick={() => setShowImport(false)} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
          </div>

          {/* 종목 매핑 */}
          <div className="mb-3 bg-white rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">신청 종목 → 등록된 종목 매핑:</p>
            {allDivisions.map((div) => (
              <div key={div} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-gray-700 truncate">{div}</span>
                <span className="text-gray-400">→</span>
                <select value={catMap[div] ?? ""} onChange={(e) => setCatMap((m) => ({ ...m, [div]: e.target.value }))} className="border rounded px-2 py-1 text-xs">
                  <option value="">등록 안 함</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ))}
            <label className="flex items-center gap-2 text-xs text-green-800 cursor-pointer mt-2">
              <input type="checkbox" checked={fallbackToCurrent} onChange={(e) => setFallbackToCurrent(e.target.checked)} className="accent-green-600" />
              매핑 안 된 선수 ({unmappedCount}명)도 현재 종목({category?.name ?? "미선택"})에 등록
            </label>
          </div>

          {/* 선수 목록 */}
          <div className="space-y-1 mb-3 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <input type="checkbox" checked={selectedAthletes.size === importAthletes.length}
                onChange={(e) => setSelectedAthletes(e.target.checked ? new Set(importAthletes.map((a) => a.id)) : new Set())} />
              전체 선택 ({importAthletes.length}명)
            </div>
            {importAthletes.map((a) => {
              const isMapped = a.divisions.some((d) => catMap[d]);
              return (
                <div key={a.id} className={`flex items-start gap-2 bg-white rounded-lg px-3 py-2 text-xs border ${selectedAthletes.has(a.id) ? (isMapped ? "border-green-300" : "border-yellow-300") : "border-gray-200"}`}>
                  <input type="checkbox" className="mt-0.5" checked={selectedAthletes.has(a.id)}
                    onChange={(e) => { const s = new Set(selectedAthletes); e.target.checked ? s.add(a.id) : s.delete(a.id); setSelectedAthletes(s); }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{a.name}</span>
                    <span className="text-gray-400 ml-2">{a.phone}</span>
                    {a.grade && <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{a.grade}</span>}
                    {!isMapped && category && <span className="ml-2 text-yellow-600 text-xs">→ {category.name}</span>}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.divisions.map((d) => (
                        <span key={d} className={`px-1.5 py-0.5 rounded text-xs ${catMap[d] ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={bulkImport} disabled={loading || selectedAthletes.size === 0}
            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? "등록 중..." : `선택된 선수 ${selectedAthletes.size}명 등록`}
          </button>
        </div>
      )}

      {/* 선수 추가 폼 (특정 종목 필터 시에만) */}
      {filterCatId && (
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`선수 직접 추가 → ${categories.find((c) => c.id === filterCatId)?.name}`} className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addContestant()} />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="연락처" className="w-36 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={addContestant} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
        </div>
      )}

      {/* 선수별 보기 */}
      {viewMode === "athlete" && (() => {
        // name+phone 기준으로 사람별 그룹핑
        const personMap = new Map<string, { name: string; phone: string; company?: string; grade?: string; paid?: boolean; entries: (Contestant & { category_name?: string })[] }>();
        for (const c of allContestants) {
          const key = `${c.name}||${(c.phone ?? "").replace(/\D/g, "")}`;
          if (!personMap.has(key)) personMap.set(key, { name: c.name, phone: c.phone ?? "", company: c.company, grade: c.grade, paid: c.paid, entries: [] });
          personMap.get(key)!.entries.push(c);
        }
        const persons = [...personMap.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
        if (persons.length === 0) return <p className="text-sm text-gray-400 text-center py-6">등록된 선수가 없습니다.</p>;
        return (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">선수별 접수 종목</span>
              <span className="text-xs text-gray-400">총 {persons.length}명 · {allContestants.length}건</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b">
                    <th className="px-3 py-2 text-center w-8 font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">이름</th>
                    <th className="px-3 py-2 text-center font-medium">입금 / 금액</th>
                    <th className="px-3 py-2 text-left font-medium">연락처</th>
                    <th className="px-3 py-2 text-left font-medium">단체명</th>
                    <th className="px-3 py-2 text-left font-medium">부문</th>
                    <th className="px-3 py-2 text-left font-medium">접수 종목 (참가번호)</th>
                    <th className="px-3 py-2 text-center w-14 font-medium sticky right-0 bg-gray-50">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {persons.map((p, idx) => (
                    <tr key={`${p.name}-${p.phone}`} className="hover:bg-gray-50 align-top">
                      <td className="px-3 py-2.5 text-center text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{p.name}</td>
                      <td className="px-3 py-2.5 text-center">
                        {(() => {
                          const allPaid = p.entries.every((e) => e.paid);
                          return (
                            <div className="flex items-center justify-center gap-1.5">
                              <input type="checkbox" checked={allPaid}
                                onChange={async () => {
                                  const target = !allPaid;
                                  for (const e of p.entries) if ((e.paid ?? false) !== target) await togglePaid(e.id, e.paid ?? false);
                                }}
                                className="w-4 h-4 accent-green-500 cursor-pointer" />
                              <span className={`text-xs font-medium whitespace-nowrap ${allPaid ? "text-green-600" : "text-gray-400"}`}>
                                {calcFee(p.grade, p.entries.length)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{p.phone}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[140px] break-words">{p.company ?? "-"}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {p.grade && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{p.grade}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {p.entries.map((e) => (
                            <span key={e.id} className="inline-flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                                {e.category_name}
                                {e.number != null && <span className="bg-purple-200 text-purple-900 rounded-full px-1.5 font-bold">{e.number}</span>}
                                <button onClick={() => setMovingId(movingId === e.id ? null : e.id)} className="ml-0.5 text-purple-400 hover:text-blue-600 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center" title="종목 변경">✎</button>
                                <button onClick={() => { if (confirm(`"${e.category_name}" 접수를 취소하시겠습니까?`)) deleteContestant(e.id, true); }} className="text-purple-400 hover:text-red-600 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center" title="접수 취소">×</button>
                              </span>
                              {movingId === e.id && (
                                <select autoFocus defaultValue="" onChange={(e2) => { if (e2.target.value) moveContestant(e.id, e2.target.value); }}
                                  className="text-xs border rounded px-1.5 py-1 bg-white max-w-[180px]">
                                  <option value="">종목 선택</option>
                                  {CATEGORY_HIERARCHY.map((group) => {
                                    const groupCats = categories.filter((cat) => cat.major_category === group.major);
                                    if (groupCats.length === 0) return null;
                                    return (
                                      <optgroup key={group.major} label={group.major}>
                                        {groupCats.map((cat) => <option key={cat.id} value={cat.id} disabled={cat.id === e.category_id}>{cat.name}{cat.id === e.category_id ? " (현재)" : ""}</option>)}
                                      </optgroup>
                                    );
                                  })}
                                </select>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={async () => {
                            if (!confirm(`${p.name} 선수의 전체 접수(${p.entries.length}개 종목)를 삭제하시겠습니까?`)) return;
                            for (const e of p.entries) await deleteContestant(e.id, true);
                          }}
                          className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap"
                        >전체삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 단체별 보기 */}
      {viewMode === "company" && (() => {
        const companyMap = new Map<string, { company: string; persons: Map<string, { name: string; phone: string; grade?: string; paid?: boolean; entries: (Contestant & { category_name?: string })[] }> }>();
        for (const c of allContestants) {
          const co = c.company?.trim() || "(단체명 없음)";
          if (!companyMap.has(co)) companyMap.set(co, { company: co, persons: new Map() });
          const personKey = `${c.name}||${(c.phone ?? "").replace(/\D/g, "")}`;
          const persons = companyMap.get(co)!.persons;
          if (!persons.has(personKey)) persons.set(personKey, { name: c.name, phone: c.phone ?? "", grade: c.grade, paid: c.paid, entries: [] });
          persons.get(personKey)!.entries.push(c);
        }
        const companies = [...companyMap.values()].sort((a, b) => a.company.localeCompare(b.company, "ko"));
        if (companies.length === 0) return <p className="text-sm text-gray-400 text-center py-6">등록된 선수가 없습니다.</p>;
        return (
          <div className="space-y-4">
            {companies.map(({ company, persons }) => {
              const personList = companySortMode === "name"
                ? [...persons.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"))
                : [...persons.values()];
              const totalEntries = personList.reduce((s, p) => s + p.entries.length, 0);
              const totalFee = personList.reduce((s, p) => s + calcFeeNum(p.grade, p.entries.length), 0);
              const paidCount = personList.filter(p => p.entries.every(e => e.paid)).length;
              const paidRate = personList.length > 0 ? Math.round(paidCount / personList.length * 100) : 0;
              return (
                <div key={company} className="bg-white rounded-xl border overflow-hidden">
                  <div className="px-4 py-2 bg-indigo-50 border-b flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-800">{company}</span>
                    <span className="text-xs text-gray-400">{personList.length}명 · {totalEntries}건</span>
                    {totalFee > 0 && (
                      <span className="text-xs font-semibold text-indigo-600 ml-1">· 총 {totalFee}만원</span>
                    )}
                    {companyNotes[company] && (
                      <span className="text-xs text-gray-500 ml-0.5">({companyNotes[company]})</span>
                    )}
                    <button
                      onClick={() => {
                        const val = window.prompt(`${company} 메모 (빈칸=삭제):`, companyNotes[company] ?? "");
                        if (val !== null) setCompanyNote(company, val);
                      }}
                      className="ml-1 text-gray-300 hover:text-gray-500 text-xs leading-none"
                      title="메모 편집"
                    >✎</button>
                    <span className={`ml-auto text-xs font-bold ${paidRate === 100 ? "text-green-600" : paidRate >= 50 ? "text-amber-500" : "text-gray-400"}`}>{paidRate}%</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        {(() => {
                          const allCompanyPaid = personList.every(p => p.entries.every(e => e.paid));
                          const someCompanyPaid = personList.some(p => p.entries.some(e => e.paid));
                          return (
                            <tr className="bg-gray-50 text-xs text-gray-500 border-b">
                              <th className="px-3 py-2 text-center w-8 font-medium">#</th>
                              <th className="px-3 py-2 text-left font-medium">이름</th>
                              <th className="px-3 py-2 text-center font-medium">
                                <div className="flex items-center justify-center gap-1.5">
                                  <input type="checkbox"
                                    checked={allCompanyPaid}
                                    ref={el => { if (el) el.indeterminate = !allCompanyPaid && someCompanyPaid; }}
                                    onChange={async () => {
                                      const target = !allCompanyPaid;
                                      for (const p of personList)
                                        for (const e of p.entries)
                                          if ((e.paid ?? false) !== target) await togglePaid(e.id, e.paid ?? false);
                                    }}
                                    className="w-4 h-4 accent-green-500 cursor-pointer" />
                                  <span>입금 / 금액</span>
                                </div>
                              </th>
                              <th className="px-3 py-2 text-left font-medium">연락처</th>
                              <th className="px-3 py-2 text-left font-medium">부문</th>
                              <th className="px-3 py-2 text-left font-medium">접수 종목 (참가번호)</th>
                              <th className="px-3 py-2 text-center w-14 font-medium sticky right-0 bg-gray-50">삭제</th>
                            </tr>
                          );
                        })()}
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {personList.map((p, idx) => (
                          <tr key={`${p.name}-${p.phone}`} className="hover:bg-gray-50 align-top">
                            <td className="px-3 py-2.5 text-center text-xs text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{p.name}</td>
                            <td className="px-3 py-2.5 text-center">
                              {(() => {
                                const allPaid = p.entries.every((e) => e.paid);
                                return (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input type="checkbox" checked={allPaid}
                                      onChange={async () => {
                                        const target = !allPaid;
                                        for (const e of p.entries) if ((e.paid ?? false) !== target) await togglePaid(e.id, e.paid ?? false);
                                      }}
                                      className="w-4 h-4 accent-green-500 cursor-pointer" />
                                    <span className={`text-xs font-medium whitespace-nowrap ${allPaid ? "text-green-600" : "text-gray-400"}`}>
                                      {calcFee(p.grade, p.entries.length)}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{p.phone}</td>
                            <td className="px-3 py-2.5 text-xs">
                              {p.grade && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{p.grade}</span>}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {p.entries.map((e) => (
                                  <span key={e.id} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                                    {e.category_name}
                                    {e.number != null && <span className="bg-purple-200 text-purple-900 rounded-full px-1.5 font-bold">{e.number}</span>}
                                    <button onClick={() => { if (confirm(`"${e.category_name}" 접수를 취소하시겠습니까?`)) deleteContestant(e.id, true); }} className="text-purple-400 hover:text-red-600 w-3.5 h-3.5 inline-flex items-center justify-center">×</button>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                              <button
                                onClick={async () => {
                                  if (!confirm(`${p.name} 선수의 전체 접수(${p.entries.length}개 종목)를 삭제하시겠습니까?`)) return;
                                  for (const e of p.entries) await deleteContestant(e.id, true);
                                }}
                                className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap"
                              >전체삭제</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 선수 목록 — 종목별 테이블 */}
      {viewMode === "category" && (contestants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {allContestants.length === 0 ? "등록된 선수가 없습니다. 신청서 또는 단체접수 파일에서 불러오세요." : "이 종목에 등록된 선수가 없습니다."}
        </p>
      ) : (() => {
        // 세부종목별 그룹
        const subGroups = new Map<string, { catName: string; catId: string; major: string; rows: typeof contestants }>();
        if (filterCatId) {
          const cat = categories.find((c) => c.id === filterCatId);
          subGroups.set(filterCatId, { catName: cat?.name ?? "", catId: filterCatId, major: cat?.major_category ?? "", rows: contestants });
        } else {
          for (const c of contestants) {
            const catId = c.category_id;
            const cat = categories.find((x) => x.id === catId);
            const catName = (c as Contestant & { category_name?: string }).category_name ?? cat?.name ?? "미분류";
            const major = cat?.major_category ?? "기타";
            if (!subGroups.has(catId)) subGroups.set(catId, { catName, catId, major, rows: [] });
            subGroups.get(catId)!.rows.push(c);
          }
        }
        // 대종목별로 묶기 (CATEGORY_HIERARCHY 순서)
        const majorOrder = CATEGORY_HIERARCHY.map((g) => g.major);
        const majorGroups = new Map<string, { major: string; subs: typeof subGroups extends Map<string, infer V> ? V[] : never }>();
        for (const [, sg] of subGroups) {
          if (!majorGroups.has(sg.major)) majorGroups.set(sg.major, { major: sg.major, subs: [] });
          majorGroups.get(sg.major)!.subs.push(sg);
        }
        const sortedMajorGroups = [...majorGroups.values()].sort((a, b) => {
          const ai = majorOrder.indexOf(a.major); const bi = majorOrder.indexOf(b.major);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
        // 세부종목: 최소 참가번호 오름차순 / 선수: 참가번호 오름차순
        for (const mg of sortedMajorGroups) {
          mg.subs.sort((a, b) => {
            const minA = Math.min(...a.rows.map((r) => r.number ?? Infinity));
            const minB = Math.min(...b.rows.map((r) => r.number ?? Infinity));
            return minA - minB;
          });
          for (const sg of mg.subs) {
            sg.rows = [...sg.rows].sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity));
          }
        }

        return (
          <div className="space-y-6">
            {sortedMajorGroups.map(({ major, subs }) => (
              <div key={major}>
                {/* 대종목 헤더 */}
                {!filterCatId && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-white bg-purple-600 rounded px-2.5 py-1">대종목 · {major}</span>
                    <span className="text-xs text-gray-400">{subs.reduce((s, g) => s + g.rows.length, 0)}명</span>
                  </div>
                )}
                <div className="space-y-3 ml-0">
                  {subs.map(({ catName, catId, rows }) => (
              <div key={catId} className="bg-white rounded-xl border overflow-hidden">
                {catName && (
                  <div className="px-4 py-2 bg-purple-50 border-b flex items-center gap-2">
                    <span className="text-sm font-semibold text-purple-800">{catName}</span>
                    <span className="text-xs text-gray-400">{rows.length}명</span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 border-b">
                        <th className="px-3 py-2 text-center w-10 font-medium">번호</th>
                        <th className="px-3 py-2 text-left font-medium">이름</th>
                        <th className="px-3 py-2 text-center w-12 font-medium">입금</th>
                        <th className="px-3 py-2 text-left font-medium">단체명</th>
                        <th className="px-3 py-2 text-left font-medium">연락처</th>
                        <th className="px-3 py-2 text-left font-medium">부문</th>
                        <th className="px-3 py-2 text-left font-medium">파일/첨부</th>
                        <th className="px-3 py-2 text-center w-12 font-medium">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 align-top">
                          <td className="px-3 py-2.5 text-center">
                            {c.number != null && (
                              <span className="text-xs font-bold text-white bg-blue-500 rounded-full px-2 py-0.5 inline-flex items-center justify-center min-w-[1.5rem]">{c.number}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{c.name}</div>
                            {movingId === c.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <select autoFocus defaultValue="" onChange={(e) => { if (e.target.value) moveContestant(c.id, e.target.value); }}
                                  className="text-xs border rounded px-1.5 py-1 bg-white max-w-[180px]">
                                  <option value="">종목 선택</option>
                                  {CATEGORY_HIERARCHY.map((group) => {
                                    const groupCats = categories.filter((cat) => cat.major_category === group.major);
                                    if (groupCats.length === 0) return null;
                                    return (
                                      <optgroup key={group.major} label={group.major}>
                                        {groupCats.map((cat) => <option key={cat.id} value={cat.id} disabled={cat.id === c.category_id}>{cat.name}{cat.id === c.category_id ? " (현재)" : ""}</option>)}
                                      </optgroup>
                                    );
                                  })}
                                </select>
                                <button onClick={() => setMovingId(null)} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                              </div>
                            ) : (
                              <button onClick={() => setMovingId(c.id)} className="text-[10px] text-blue-400 hover:text-blue-600 mt-0.5">종목 변경</button>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <label className="inline-flex flex-col items-center gap-0.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={c.paid ?? false}
                                onChange={() => togglePaid(c.id, c.paid ?? false)}
                                className="w-4 h-4 accent-green-600"
                              />
                              <span className={`text-xs font-medium ${c.paid ? "text-green-600" : "text-gray-300"}`}>{c.paid ? "✓" : "-"}</span>
                            </label>
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                            {editCompany?.id === c.id ? (
                              <input
                                autoFocus
                                value={editCompany.value}
                                onChange={(e) => setEditCompany({ id: c.id, value: e.target.value })}
                                onBlur={() => saveCompany(c.id, editCompany.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveCompany(c.id, editCompany.value); if (e.key === "Escape") setEditCompany(null); }}
                                className="border rounded px-1.5 py-0.5 text-xs w-full min-w-[80px] focus:outline-none focus:border-blue-400"
                              />
                            ) : (
                              <span
                                onClick={() => setEditCompany({ id: c.id, value: c.company ?? "" })}
                                className="cursor-pointer hover:text-blue-600 hover:underline"
                                title="클릭하여 수정"
                              >
                                {c.company ?? <span className="text-gray-300 italic">단체명 없음</span>}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{c.phone ?? "-"}</td>
                          <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                            {c.grade && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{c.grade}</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 items-center">
                              {(c.contestant_files ?? []).map((f) => (
                                <div key={f.id} className="flex items-center gap-1 bg-gray-100 rounded px-1.5 py-0.5 text-xs whitespace-nowrap">
                                  <span>{f.file_type === "youtube" ? "▶" : f.file_type.startsWith("video") ? "🎬" : "🖼"}</span>
                                  <span className="max-w-[90px] truncate">
                                    {f.file_type === "youtube" ? `YT:${getYouTubeId(f.video_url ?? "")}` : f.file_name}
                                  </span>
                                  {f.file_type === "youtube" && f.video_url
                                    ? <a href={f.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500">↗</a>
                                    : f.storage_path && <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/contestant-files/${f.storage_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">↗</a>}
                                  <button onClick={() => deleteFile(f.id, f.storage_path)} className="text-red-400 hover:text-red-600">×</button>
                                </div>
                              ))}
                              <label className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer transition whitespace-nowrap ${uploading === c.id ? "bg-gray-200 text-gray-400" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                                {uploading === c.id ? "..." : "+파일"}
                                <input type="file" className="hidden" accept="image/*,video/*" disabled={uploading === c.id}
                                  onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(c.id, file); e.target.value = ""; }} />
                              </label>
                              {ytInputId === c.id ? (
                                <div className="flex gap-1 items-center">
                                  <input autoFocus value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
                                    placeholder="https://youtu.be/..." className="border rounded px-2 py-0.5 text-xs w-36"
                                    onKeyDown={(e) => { if (e.key === "Enter") addYouTubeUrl(c.id); if (e.key === "Escape") { setYtInputId(null); setYtUrl(""); } }} />
                                  <button onClick={() => addYouTubeUrl(c.id)} className="px-2 py-0.5 bg-red-600 text-white rounded text-xs">등록</button>
                                  <button onClick={() => { setYtInputId(null); setYtUrl(""); }} className="text-gray-400 text-xs">✕</button>
                                </div>
                              ) : (
                                <button onClick={() => { setYtInputId(c.id); setYtUrl(""); }}
                                  className="px-2 py-0.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs whitespace-nowrap">▶YT</button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => deleteContestant(c.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })())}
    </div>
  );
}

// ─── JudgesTab ────────────────────────────────────────────────
function JudgesTab({ competition, categories, onMsg }: { category: Category | null; competition: Competition | null; categories: Category[]; onMsg: (m: string) => void }) {
  const [email, setEmail] = useState("");
  const [directMajor, setDirectMajor] = useState("");
  const [loading, setLoading] = useState(false);
  const [importJudges, setImportJudges] = useState<ImportJudge[]>([]);
  const [showImport, setShowImport] = useState(false);
  // { judgeId → { paid, majorCategory, title } }
  const [judgeConfig, setJudgeConfig] = useState<Record<string, { paid: boolean; selectedMajors: string[]; title: string }>>({});
  // 배정 완료된 심사위원 목록 (전체 카테고리)
  const [allAssignments, setAllAssignments] = useState<(Assignment & { category_name?: string; major_category?: string })[]>([]);

  // 등록된 대종목 목록 (categories에서 distinct major_category)
  const majorList = [...new Set(categories.map((c) => c.major_category).filter(Boolean))] as string[];
  // CATEGORY_HIERARCHY 순서로 정렬
  const sortedMajors = CATEGORY_HIERARCHY.map((g) => g.major).filter((m) => majorList.includes(m));

  const loadAssignments = useCallback(async () => {
    if (!competition) { setAllAssignments([]); return; }
    try {
      const data = await api(`/api/judge/assignments?competition_id=${competition.id}`);
      setAllAssignments(data);
    } catch { /* ignore */ }
  }, [competition]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const loadImportJudges = async () => {
    if (!competition?.contest_slug) { onMsg("신청서와 연결된 대회가 아닙니다."); return; }
    try {
      const data = await api(`/api/judge/import?action=data&contest_slug=${competition.contest_slug}`);
      const config: Record<string, { paid: boolean; selectedMajors: string[]; title: string }> = {};
      for (const j of data.judges as ImportJudge[]) {
        const selectedMajors: string[] = [];
        for (const catName of j.categories) {
          const major = CATEGORY_HIERARCHY.find((g) => g.major === catName || g.judgeLabel === catName)?.major;
          if (major) selectedMajors.push(major);
        }
        config[j.id] = { paid: false, selectedMajors, title: j.title || "심사위원" };
      }
      // 기존 Excel 데이터에 MERGE (이름+전화 기준 중복 제거)
      setImportJudges((prev) => {
        const existingKeys = new Set(prev.map((j) => `${j.name}||${j.phone.replace(/\D/g, "")}`));
        const fresh = (data.judges as ImportJudge[]).filter((j) => !existingKeys.has(`${j.name}||${j.phone.replace(/\D/g, "")}`));
        return [...prev, ...fresh];
      });
      setJudgeConfig((prev) => ({ ...prev, ...config }));
      setShowImport(true);
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  const setPaid = (id: string, paid: boolean) =>
    setJudgeConfig((prev) => ({ ...prev, [id]: { ...prev[id], paid } }));
  const setTitle = (id: string, val: string) =>
    setJudgeConfig((prev) => ({ ...prev, [id]: { ...prev[id], title: val } }));
  const toggleMajor = (judgeId: string, major: string, checked: boolean) =>
    setJudgeConfig((prev) => {
      const curr = prev[judgeId];
      const majors = checked
        ? [...new Set([...(curr.selectedMajors ?? []), major])]
        : (curr.selectedMajors ?? []).filter((m) => m !== major);
      return { ...prev, [judgeId]: { ...curr, selectedMajors: majors } };
    });

  const bulkAssign = async () => {
    const toAssign = importJudges.filter((j) => judgeConfig[j.id]?.paid && (judgeConfig[j.id]?.selectedMajors?.length ?? 0) > 0);
    if (toAssign.length === 0) { onMsg("입금 확인 + 배정 대종목이 선택된 심사위원이 없습니다."); return; }
    setLoading(true);
    try {
      const assignments: Array<{ email: string; category_id: string; title: string; name: string; phone?: string }> = [];
      for (const j of toAssign) {
        const { selectedMajors, title } = judgeConfig[j.id];
        for (const major of selectedMajors) {
          const subCats = categories.filter((c) => c.major_category === major);
          for (const cat of subCats) {
            assignments.push({ email: j.email, category_id: cat.id, title, name: j.name, phone: j.phone });
          }
        }
      }
      if (assignments.length === 0) { onMsg("배정할 세부종목이 없습니다. 대종목을 먼저 등록해주세요 (대회·종목 탭 → 전체 종목 일괄 생성)."); setLoading(false); return; }
      const result = await api("/api/judge/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "judges", assignments }) });
      const errorNames = result.errors?.length > 0 ? [...new Set<string>(result.errors.map((e: string) => e.split(":")[0]))] : [];
      const errorDetails = errorNames.length > 0 ? ` | 미등록: ${errorNames.join(", ")}` : "";
      onMsg(`✅ 심사위원 ${result.inserted}건 배정 완료 (${toAssign.length}명 × 세부종목)${errorDetails}`);
      setShowImport(false);
      await loadAssignments();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const addJudgeDirect = async () => {
    if (!email.trim() || !directMajor) return;
    setLoading(true);
    try {
      const subCats = categories.filter((c) => c.major_category === directMajor);
      for (const cat of subCats) {
        await api("/api/judge/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), category_id: cat.id }) });
      }
      setEmail(""); await loadAssignments();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const removeJudge = async (id: string) => {
    try { await api("/api/judge/assignments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await loadAssignments(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  // 이미 배정 완료된 심사위원 이름 set (목록에서 제외)
  const assignedJudgeNames = new Set(allAssignments.map((a) => a.judge_name).filter(Boolean) as string[]);
  const unassignedJudges = importJudges.filter((j) => !assignedJudgeNames.has(j.name));

  const paidCount = unassignedJudges.filter((j) => judgeConfig[j.id]?.paid).length;

  const handleJudgeExcel = async (file: File) => {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const sheetName = wb.SheetNames.find((n) => n.includes("심사위원")) ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { defval: "", header: 1 });

      // 헤더 행 찾기 (이름(한글) / 이름 / 성명 포함된 행)
      let headerIdx = -1;
      let colName = 1, colCompany = 2, colPhone = 5, colEmail = -1, colTitle = -1, colCategory = 7, colCareer = 6;
      for (let i = 0; i < Math.min(15, rawRows.length); i++) {
        const row = rawRows[i].map((c) => String(c ?? "").trim());
        const nameCol = row.findIndex((c) => /^이름|^성명/.test(c));
        if (nameCol >= 0) {
          headerIdx = i;
          colName = nameCol;
          const phoneCol = row.findIndex((c) => /연락처|전화/.test(c));
          const emailCol = row.findIndex((c) => /이메일|email/i.test(c));
          const titleCol = row.findIndex((c) => /직책|직위|title/i.test(c));
          const catCol = row.findIndex((c) => /종목|카테고리|분야/.test(c));
          const careerCol = row.findIndex((c) => /경력|career/i.test(c));
          const companyCol = row.findIndex((c) => /상호|기관|단체/.test(c));
          if (phoneCol >= 0) colPhone = phoneCol;
          if (emailCol >= 0) colEmail = emailCol;
          if (titleCol >= 0) colTitle = titleCol;
          if (catCol >= 0) colCategory = catCol;
          if (careerCol >= 0) colCareer = careerCol;
          if (companyCol >= 0) colCompany = companyCol;
          break;
        }
      }
      const startRow = headerIdx >= 0 ? headerIdx + 1 : 1;

      const parsed: ImportJudge[] = [];
      for (let i = startRow; i < rawRows.length; i++) {
        const row = rawRows[i];
        const name = String(row[colName] ?? "").trim();
        if (!name || /^이름|^성명/.test(name) || isNaN(Number(row[0])) && String(row[0]).trim() === "") continue;
        if (!name) continue;
        const company = String(row[colCompany] ?? "").trim();
        const phone = String(row[colPhone] ?? "").trim();
        const email = colEmail >= 0 ? String(row[colEmail] ?? "").trim() : "";
        const title = colTitle >= 0 ? String(row[colTitle] ?? "").trim() || "심사위원" : "심사위원";
        const categoryRaw = String(row[colCategory] ?? "").trim();
        const categories = categoryRaw ? categoryRaw.split(/[,，、]/).map((c) => c.trim()).filter(Boolean) : [];
        const career = company ? `${company} | ${String(row[colCareer] ?? "").trim()}`.replace(/ \| $/, "") : String(row[colCareer] ?? "").trim();
        parsed.push({ id: `excel-${i}`, name, phone, email, title, categories, career });
      }

      if (parsed.length === 0) { onMsg("심사위원 데이터를 찾을 수 없습니다. 시트 이름이 '심사위원'인지 확인해주세요."); setLoading(false); return; }

      const config: Record<string, { paid: boolean; selectedMajors: string[]; title: string }> = {};
      for (const j of parsed) {
        const selectedMajors: string[] = [];
        for (const catName of j.categories) {
          const major = CATEGORY_HIERARCHY.find((g) => g.major === catName || g.judgeLabel === catName)?.major;
          if (major) selectedMajors.push(major);
        }
        config[j.id] = { paid: false, selectedMajors, title: j.title || "심사위원" };
      }
      // 기존 신청서 데이터에 MERGE (이름+전화 기준 중복 제거)
      setImportJudges((prev) => {
        const existingKeys = new Set(prev.map((j) => `${j.name}||${j.phone.replace(/\D/g, "")}`));
        const fresh = parsed.filter((j) => !existingKeys.has(`${j.name}||${j.phone.replace(/\D/g, "")}`));
        return [...prev, ...fresh];
      });
      setJudgeConfig((prev) => ({ ...prev, ...config }));
      setShowImport(true);
      onMsg(`📁 ${sheetName} 시트에서 심사위원 ${parsed.length}명 불러옴 (중복 자동 제외)`);
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const deduplicateJudges = async () => {
    if (!competition) return;
    if (!confirm("동일 심사위원이 같은 종목에 중복 배정된 항목을 삭제합니다. 계속하시겠습니까?")) return;
    setLoading(true);
    try {
      const seen = new Set<string>();
      const toDelete: string[] = [];
      const sorted = [...allAssignments].sort((a, b) => a.id.localeCompare(b.id));
      for (const a of sorted) {
        const key = `${a.user_id}||${a.category_id}`;
        if (seen.has(key)) toDelete.push(a.id);
        else seen.add(key);
      }
      if (toDelete.length === 0) { onMsg("중복 배정 없음"); setLoading(false); return; }
      for (const id of toDelete) {
        await api("/api/judge/assignments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      }
      onMsg(`✅ 중복 ${toDelete.length}건 삭제 완료`);
      await loadAssignments();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {competition?.contest_slug && (
          <button onClick={loadImportJudges} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            📋 신청서에서 불러오기
          </button>
        )}
        <label className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 cursor-pointer">
          📁 단체접수 파일
          <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJudgeExcel(f); e.target.value = ""; }} />
        </label>
        {allAssignments.length > 0 && (
          <button onClick={deduplicateJudges} disabled={loading} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 disabled:opacity-50 border border-orange-300">
            🔄 중복 자동 삭제
          </button>
        )}
      </div>

      {/* 신청서 Import UI — 결제 확인 우선 흐름 */}
      {showImport && (
        <div className="border border-green-200 rounded-xl bg-green-50 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-green-800">심사위원 신청서 목록 ({unassignedJudges.length}명 미배정 / 전체 {importJudges.length}명)</p>
            <button onClick={() => setShowImport(false)} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
          </div>
          <p className="text-xs text-gray-500 mb-4">오른쪽 <strong>입금 확인</strong> 체크 → 종목·직책 선택 → 일괄 배정</p>

          <div className="overflow-x-auto mb-4 max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-green-100 text-xs text-green-800">
                  <th className="px-3 py-2 text-left font-medium">이름</th>
                  <th className="px-3 py-2 text-left font-medium">연락처</th>
                  <th className="px-3 py-2 text-left font-medium">직책</th>
                  <th className="px-3 py-2 text-left font-medium">신청종목 (체크=배정)</th>
                  <th className="px-3 py-2 text-left font-medium max-w-[180px]">경력</th>
                  <th className="px-3 py-2 text-center font-medium w-24">입금확인 / 직책</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {unassignedJudges.map((j) => {
                  const cfg = judgeConfig[j.id] ?? { paid: false, selectedMajors: [], title: "심사위원" };
                  return (
                    <tr key={j.id} className={`align-top hover:bg-gray-50 transition ${cfg.paid ? "bg-green-50" : ""}`}>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{j.name}</div>
                        <div className="text-xs text-gray-400">{j.email}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{j.phone}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {j.title && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">{j.title}</span>}
                      </td>
                      {/* 신청종목 — 입금확인 시 대종목 체크박스로 전환 */}
                      <td className="px-3 py-2.5">
                        {cfg.paid ? (
                          <div className="flex flex-wrap gap-1">
                            {/* 신청 종목에서 매핑된 대종목 */}
                            {(() => {
                              // 신청종목 → 대종목 (정확히 일치하는 것만)
                              const appliedMajors = [...new Set(
                                j.categories
                                  .map((cn) => CATEGORY_HIERARCHY.find((g) => g.major === cn || g.judgeLabel === cn)?.major)
                                  .filter(Boolean) as string[]
                              )];
                              // 못 찾은 항목 (수동 선택 필요)
                              const unmapped = j.categories.filter(
                                (cn) => !CATEGORY_HIERARCHY.find((g) => g.major === cn || g.judgeLabel === cn)
                              );
                              return (
                                <>
                                  {appliedMajors.map((major) => {
                                    const isRegistered = sortedMajors.includes(major);
                                    const isSelected = cfg.selectedMajors.includes(major);
                                    if (!isRegistered) {
                                      return <span key={major} className="text-xs bg-orange-50 border border-orange-200 text-orange-600 px-2 py-0.5 rounded-full">{major} (미등록)</span>;
                                    }
                                    return (
                                      <label key={major} className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 cursor-pointer border transition select-none ${isSelected ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                                        <input type="checkbox" checked={isSelected}
                                          onChange={(e) => toggleMajor(j.id, major, e.target.checked)}
                                          className="w-3 h-3 accent-green-600" />
                                        {major}
                                      </label>
                                    );
                                  })}
                                  {unmapped.map((cn) => (
                                    <div key={cn} className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 text-xs">
                                      <span className="text-orange-500">?{cn}</span>
                                      <select defaultValue="" onChange={(e) => { if (e.target.value) { toggleMajor(j.id, e.target.value, true); (e.target as HTMLSelectElement).value = ""; } }}
                                        className="border rounded px-1 py-0.5 text-xs max-w-[90px]">
                                        <option value="">선택</option>
                                        {sortedMajors.filter((m) => !cfg.selectedMajors.includes(m)).map((m) => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                    </div>
                                  ))}
                                  {/* 추가 대종목 수동 선택 */}
                                  <select defaultValue="" onChange={(e) => { if (e.target.value) { toggleMajor(j.id, e.target.value, true); (e.target as HTMLSelectElement).value = ""; } }}
                                    className="border rounded px-1.5 py-0.5 text-xs text-gray-500 max-w-[80px]">
                                    <option value="">+추가</option>
                                    {sortedMajors.filter((m) => !cfg.selectedMajors.includes(m)).map((m) => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="flex gap-1 flex-wrap">
                            {j.categories.map((c) => <span key={c} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap">{c}</span>)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[180px]">
                        <span className="line-clamp-2">{j.career}</span>
                      </td>
                      {/* 입금확인 + 직책 통합 */}
                      <td className="px-3 py-2.5 text-center">
                        <label className={`inline-flex flex-col items-center gap-1 cursor-pointer px-2 py-1 rounded-lg transition ${cfg.paid ? "bg-green-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                          <input type="checkbox" className="w-4 h-4 accent-green-600" checked={cfg.paid}
                            onChange={(e) => setPaid(j.id, e.target.checked)} />
                          <span className={`text-xs font-medium whitespace-nowrap ${cfg.paid ? "text-green-700" : "text-gray-400"}`}>
                            {cfg.paid ? "입금✓" : "미확인"}
                          </span>
                        </label>
                        {cfg.paid && (
                          <select value={cfg.title} onChange={(e) => setTitle(j.id, e.target.value)}
                            className="mt-1 border rounded px-1.5 py-1 text-xs font-medium text-gray-700 w-full">
                            {JUDGE_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-green-200">
            <span className="text-xs text-gray-600">입금 확인: <strong className="text-green-700">{paidCount}명</strong> / {unassignedJudges.length}명</span>
            <button onClick={bulkAssign} disabled={loading || paidCount === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? "배정 중..." : `입금확인 ${paidCount}명 일괄 배정`}
            </button>
          </div>
        </div>
      )}

      {/* 배정된 심사위원 목록 — 사람 단위 그룹 */}
      {allAssignments.length > 0 && (() => {
        // 사람별로 그룹화 (user_id 기준)
        const personMap = new Map<string, { name: string; email: string; titles: string[]; cats: (Assignment & { category_name?: string; major_category?: string })[] }>();
        for (const a of allAssignments) {
          const uid = a.user_id;
          if (!personMap.has(uid)) {
            personMap.set(uid, {
              name: a.judge_name ?? a.users?.name ?? "(이름 없음)",
              email: a.users?.email ?? "",
              titles: [],
              cats: [],
            });
          }
          const p = personMap.get(uid)!;
          p.cats.push(a);
          if (a.title && !p.titles.includes(a.title)) p.titles.push(a.title);
        }
        const persons = [...personMap.values()];
        return (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">배정 완료 심사위원</span>
              <span className="text-xs text-gray-400">{persons.length}명 · {allAssignments.length}건</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b">
                    <th className="px-3 py-2 text-left font-medium">이름</th>
                    <th className="px-3 py-2 text-left font-medium">이메일</th>
                    <th className="px-3 py-2 text-left font-medium">직책</th>
                    <th className="px-3 py-2 text-left font-medium w-28">대종목</th>
                    <th className="px-3 py-2 text-left font-medium">세부종목</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {persons.map((p) => {
                    // 대종목별 그룹화
                    const majorGroups: { major: string; cats: typeof p.cats }[] = [];
                    for (const a of p.cats) {
                      const major = a.major_category ?? "(미분류)";
                      const g = majorGroups.find((x) => x.major === major);
                      if (g) g.cats.push(a);
                      else majorGroups.push({ major, cats: [a] });
                    }
                    return (
                      <tr key={p.email} className="hover:bg-gray-50 align-top">
                        <td className="px-3 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{p.name}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{p.email}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                          {p.titles.map((t) => (
                            <span key={t} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap mr-1">{t}</span>
                          ))}
                        </td>
                        {/* 대종목 */}
                        <td className="px-3 py-2.5 align-top">
                          <div className="space-y-2">
                            {majorGroups.map((g) => (
                              <div key={g.major} className="py-0.5">
                                <span className="inline-block bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded whitespace-nowrap">{g.major}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* 세부종목 */}
                        <td className="px-3 py-2.5 align-top">
                          <div className="space-y-2">
                            {majorGroups.map((g) => (
                              <div key={g.major} className="flex flex-wrap gap-1">
                                {g.cats.map((a) => (
                                  <span key={a.id} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                                    {a.category_name ?? a.category_id}
                                    <button onClick={() => removeJudge(a.id)} className="text-purple-300 hover:text-red-500 ml-0.5 leading-none" title="배정 해제">×</button>
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
      {allAssignments.length === 0 && !showImport && <p className="text-sm text-gray-400">배정된 심사위원이 없습니다.</p>}

      <div className="flex gap-2 pt-2 border-t">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 (직접 배정)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addJudgeDirect()} />
        <select value={directMajor} onChange={(e) => setDirectMajor(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">대종목 선택</option>
          {sortedMajors.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={addJudgeDirect} disabled={loading || !directMajor} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">배정</button>
      </div>
    </div>
  );
}

// ─── CriteriaTab ──────────────────────────────────────────────
function CriteriaTab({ category, competition, onMsg }: { category: Category | null; competition: Competition | null; onMsg: (m: string) => void }) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [loading, setLoading] = useState(false);
  const [seedType, setSeedType] = useState<"출품" | "대면">("출품");
  const [seeding, setSeeding] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);

  const load = useCallback(async () => {
    if (!category) return;
    try { const data = await api(`/api/judge/criteria?category_id=${category.id}`); setCriteria(data); }
    catch { /* ignore */ }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const seedCriteria = async () => {
    if (!category) return;
    if (criteria.length > 0 && !confirm(`기존 채점 항목 ${criteria.length}개를 삭제하고 "${category.name}"의 ${seedType} 기준으로 새로 등록합니다. 계속하시겠습니까?`)) return;
    setSeeding(true);
    try {
      const res = await api("/api/judge/criteria/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: category.id, competition_type: seedType }) });
      onMsg(`✅ "${res.category_name}" ${seedType} 기준 ${res.inserted}개 항목 등록 완료 (총 ${res.total}점)`);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setSeeding(false);
  };

  const seedAllCriteria = async () => {
    if (!competition) { onMsg("대회를 먼저 선택하세요."); return; }
    if (!confirm(`"${competition.title}"의 전체 종목에 ${seedType}대회 기준 채점항목을 일괄 등록합니다.\n기존 항목이 모두 교체됩니다. 계속하시겠습니까?`)) return;
    setSeedingAll(true);
    try {
      const res = await api("/api/judge/criteria/seed-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: competition.id, competition_type: seedType }) });
      const msg = `✅ 전체 종목 채점항목 등록 완료 — ${res.seeded}개 종목 성공` +
        (res.skipped > 0 ? ` / ${res.skipped}개 건너뜀 (${res.skippedNames.join(", ")})` : "");
      onMsg(msg);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setSeedingAll(false);
  };

  const addCriterion = async () => {
    if (!category || !newName.trim()) return;
    setLoading(true);
    try { await api("/api/judge/criteria", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: category.id, name: newName.trim(), max_score: parseInt(newMax) || 100, display_order: criteria.length }) }); setNewName(""); setNewMax("100"); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const deleteCriterion = async (id: string) => {
    if (!confirm("이 항목을 삭제하면 관련 채점 데이터도 삭제됩니다.")) return;
    try { await api("/api/judge/criteria", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  const total = criteria.reduce((s, c) => s + c.max_score, 0);
  if (!competition) return <p className="text-sm text-gray-400">대회·종목 탭에서 대회를 먼저 선택하세요.</p>;

  return (
    <div className="space-y-4">
      {/* 자동 설정 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-indigo-800 mb-3">자동 설정 — IBC 심사기준표 기반</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-indigo-300 overflow-hidden">
            {(["출품", "대면"] as const).map((t) => (
              <button key={t} onClick={() => setSeedType(t)} className={`px-4 py-1.5 text-sm font-medium transition ${seedType === t ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-indigo-50"}`}>{t}대회</button>
            ))}
          </div>
          {/* 전체 일괄 */}
          <button onClick={seedAllCriteria} disabled={seedingAll || seeding} className="px-5 py-1.5 bg-indigo-700 text-white rounded-lg text-sm font-bold hover:bg-indigo-800 disabled:opacity-50">
            {seedingAll ? "등록 중..." : "전체 종목 일괄 자동설정"}
          </button>
          {/* 선택 종목만 */}
          {category && (
            <button onClick={seedCriteria} disabled={seeding || seedingAll} className="px-4 py-1.5 bg-white border border-indigo-400 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50">
              {seeding ? "등록 중..." : `"${category.name}" 만 설정`}
            </button>
          )}
          <span className="text-xs text-indigo-500">기존 항목을 모두 교체합니다</span>
        </div>
      </div>

      {criteria.length > 0 && <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">총 배점: <strong>{total}점</strong></div>}
      <div className="space-y-2">
        {criteria.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <span className="font-medium text-gray-800">{c.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-600">{c.max_score}점</span>
              <button onClick={() => deleteCriterion(c.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>
          </div>
        ))}
        {criteria.length === 0 && <p className="text-sm text-gray-400">등록된 채점 항목이 없습니다. 위 자동 설정을 사용하거나 직접 추가하세요.</p>}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="항목명 직접 추가 (예: 기술력)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCriterion()} />
        <input value={newMax} onChange={(e) => setNewMax(e.target.value)} type="number" min="1" placeholder="배점" className="w-20 border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addCriterion} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
      </div>
    </div>
  );
}

// ─── AwardsTab ────────────────────────────────────────────────
function AwardsTab({ category, competition, onMsg }: { category: Category | null; competition: Competition | null; onMsg: (m: string) => void }) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [newName, setNewName] = useState("");
  const [newCount, setNewCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    if (!category) return;
    try { const data = await api(`/api/judge/awards?category_id=${category.id}`); setAwards(data); }
    catch { /* ignore */ }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const seedCategory = async () => {
    if (!category) return;
    if (awards.length > 0 && !confirm(`"${category.name}"의 기존 시상 ${awards.length}개를 삭제하고 금상·은상·동상·장려상으로 교체합니다.`)) return;
    setSeeding(true);
    try {
      await api("/api/judge/awards/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: category.id }) });
      onMsg(`✅ "${category.name}" 시상 설정 완료`);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setSeeding(false);
  };

  const seedAllCategories = async () => {
    if (!competition) return;
    if (!confirm(`"${competition.title}"의 모든 종목에 금상·은상·동상·장려상을 일괄 적용합니다. 기존 시상이 있으면 교체됩니다.`)) return;
    setSeeding(true);
    try {
      const res = await api("/api/judge/awards/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: competition.id }) });
      onMsg(`✅ ${res.count}개 종목 시상 일괄 설정 완료 (${res.applied_to.join(", ")})`);
      await load();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setSeeding(false);
  };

  const addAward = async () => {
    if (!category || !newName.trim()) return;
    setLoading(true);
    try { await api("/api/judge/awards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: category.id, award_name: newName.trim(), count: parseInt(newCount) || 1, display_order: awards.length }) }); setNewName(""); setNewCount("1"); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const deleteAward = async (id: string) => {
    try { await api("/api/judge/awards", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  if (!category) return <p className="text-sm text-gray-400">종목을 먼저 선택하세요.</p>;

  const AWARD_COLORS: Record<string, string> = { "금상": "text-yellow-600", "은상": "text-gray-500", "동상": "text-orange-500", "장려상": "text-green-600" };

  return (
    <div className="space-y-4">
      {/* 자동 설정 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-3">자동 설정 — 금상·은상·동상·장려상 (각 1명)</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={seedCategory} disabled={seeding} className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
            {seeding ? "설정 중..." : `"${category.name}" 이 종목만`}
          </button>
          {competition && (
            <button onClick={seedAllCategories} disabled={seeding} className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
              {seeding ? "설정 중..." : "전체 종목 일괄 적용"}
            </button>
          )}
          <span className="text-xs text-amber-600 self-center">기존 시상을 교체합니다</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">점수 상위 순서대로 시상이 배분됩니다. 인원수는 직접 수정하세요.</p>
      <div className="space-y-2">
        {awards.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <span className={`font-semibold ${AWARD_COLORS[a.award_name] ?? "text-blue-600"}`}>{a.award_name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">{a.count}명</span>
              <button onClick={() => deleteAward(a.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>
          </div>
        ))}
        {awards.length === 0 && <p className="text-sm text-gray-400">등록된 시상이 없습니다. 위 자동 설정을 사용하거나 직접 추가하세요.</p>}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="시상명 직접 추가 (예: 최우수상)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addAward()} />
        <input value={newCount} onChange={(e) => setNewCount(e.target.value)} type="number" min="1" placeholder="인원" className="w-20 border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addAward} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function JudgeAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("competitions");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [msg, setMsg] = useState("");

  const loadCompetitions = useCallback(async () => {
    try { const data = await api("/api/judge/competitions"); setCompetitions(data); }
    catch { /* ignore */ }
  }, []);

  const loadCategories = useCallback(async () => {
    if (!selectedCompetition) return setCategories([]);
    try { const data = await api(`/api/judge/categories?competition_id=${selectedCompetition.id}`); setCategories(data); }
    catch { /* ignore */ }
  }, [selectedCompetition]);

  useEffect(() => { loadCompetitions(); }, [loadCompetitions]);
  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(""), 5000); return () => clearTimeout(t); } }, [msg]);

  const handleRefresh = () => { loadCompetitions(); loadCategories(); };

  const contextLabel = selectedCategory
    ? `${selectedCompetition?.title} › ${selectedCategory.name}`
    : selectedCompetition
    ? `${selectedCompetition.title} (종목 미선택)`
    : "대회·종목 탭에서 선택하세요";

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚖️ 심사 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">IBC 온라인 심사 시스템</p>
          </div>
          <div className="flex gap-2">
            <a href="/admin" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">← 관리자</a>
            <a href="/judge/result" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">결과 확인 →</a>
          </div>
        </div>

        {msg && <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{msg}</div>}

        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === t.key ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab !== "competitions" && (
          <div className="mb-4 px-4 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 flex items-center gap-2">
            <span>선택: <strong>{contextLabel}</strong></span>
            {!selectedCategory && (
              <button onClick={() => setActiveTab("competitions")} className="text-blue-600 hover:underline">← 종목 선택하러 가기</button>
            )}
          </div>
        )}

        <div>
          {activeTab === "competitions" && (
            <CompetitionsTab
              competitions={competitions} categories={categories}
              selectedCompetition={selectedCompetition} selectedCategory={selectedCategory}
              onSelectCompetition={(c) => { setSelectedCompetition(c); if (c?.id !== selectedCompetition?.id) setSelectedCategory(null); }}
              onSelectCategory={setSelectedCategory}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === "contestants" && (
            <ContestantsTab category={selectedCategory} competition={selectedCompetition} categories={categories} onMsg={setMsg} />
          )}
          {activeTab === "judges" && (
            <JudgesTab category={selectedCategory} competition={selectedCompetition} categories={categories} onMsg={setMsg} />
          )}

          {activeTab === "criteria" && <CriteriaTab category={selectedCategory} competition={selectedCompetition} onMsg={setMsg} />}
          {activeTab === "awards" && <AwardsTab category={selectedCategory} competition={selectedCompetition} onMsg={setMsg} />}
        </div>
      </div>
    </div>
  );
}
