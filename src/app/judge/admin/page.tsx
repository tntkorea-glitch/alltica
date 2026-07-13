"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────
interface Competition { id: string; title: string; description?: string; date_display?: string; status: string; contest_slug?: string; }
interface Category { id: string; competition_id: string; name: string; display_order: number; }
interface Contestant { id: string; category_id: string; name: string; phone?: string; email?: string; company?: string; grade?: string; number?: number; display_order: number; contestant_files?: ContestantFile[]; }
interface ContestantFile { id: string; contestant_id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
interface Criterion { id: string; category_id: string; name: string; max_score: number; display_order: number; }
interface Assignment { id: string; user_id: string; category_id: string; title?: string; users: { email: string; name?: string; }; }
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

const JUDGE_TITLES = ["수석심사위원", "심사위원", "글로벌심사위원", "특별심사위원", "명예심사위원"];

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
        try {
          await api("/api/judge/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: selectedCompetition.id, name, display_order: categories.length + added }) });
          added++;
        } catch { /* skip */ }
      }
    }
    setMsg(`종목 ${added}개 추가됐습니다.`); onRefresh(); setShowCatImport(false);
    setLoading(false);
  };

  const addCategory = async () => {
    if (!selectedCompetition || !newCatName.trim()) return;
    setLoading(true);
    try {
      await api("/api/judge/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competition_id: selectedCompetition.id, name: newCatName.trim(), display_order: categories.length }) });
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
            {selectedCompetition.contest_slug && (
              <button onClick={loadImportCategories} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                📋 신청서에서 자동 추가
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">종목을 선택하면 다른 탭에서 선수·심사위원 관리가 가능합니다.</p>

          {showCatImport && (
            <div className="mb-4 border border-green-200 rounded-xl bg-green-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-800">신청서에서 감지된 종목 ({importCategories.length}개):</p>
                <button onClick={importAllCategories} disabled={loading} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50">전체 추가</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {importCategories.map((name) => {
                  const exists = categories.some((c) => c.name === name);
                  return (
                    <div key={name} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border ${exists ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-800 border-gray-300"}`}>
                      <span className="max-w-[200px] truncate">{name}</span>
                      {exists ? <span className="text-green-600">✓</span> : <button onClick={() => importCategory(name)} className="text-blue-600 hover:text-blue-800 font-medium ml-1">+ 추가</button>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowCatImport(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">닫기</button>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {categories.map((cat) => (
              <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${selectedCategory?.id === cat.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onClick={() => onSelectCategory(cat)}>
                <span className="font-medium text-gray-900">{cat.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">삭제</button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-400">등록된 종목이 없습니다.</p>}
          </div>

          <div className="flex gap-2">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="종목명 직접 입력" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <button onClick={addCategory} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
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

  // 신청서 import state
  const [importAthletes, setImportAthletes] = useState<ImportAthlete[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [allDivisions, setAllDivisions] = useState<string[]>([]);

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
  const [dataFiles, setDataFiles] = useState<Array<{ filename: string; rows: Array<{ name: string; phone: string; company: string; grade: string; mainCategory: string; division: string }>; divisions: string[] }>>([]);
  const [showDataFile, setShowDataFile] = useState(false);
  const [dataFileCatMap, setDataFileCatMap] = useState<Record<string, string>>({});
  const [fallbackToCurrent, setFallbackToCurrent] = useState(true);

  const loadDataFiles = async () => {
    try {
      const data = await api("/api/judge/import-excel");
      setDataFiles(data.files);
      // 자동 매핑
      const allDivs = [...new Set(data.files.flatMap((f: { divisions: string[] }) => f.divisions))];
      const map: Record<string, string> = {};
      for (const div of allDivs as string[]) {
        const matched = categories.find((c) => c.name === div || div.includes(c.name) || c.name.includes(div.split("(")[0]));
        if (matched) map[div] = matched.id;
      }
      setDataFileCatMap(map);
      setShowDataFile(true);
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

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
      onMsg(`단체접수 파일에서 선수 ${result.inserted}명 등록 완료${result.skipped > 0 ? ` (${result.skipped}건 종목 미매핑 제외)` : ""}`);
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
      onMsg(`선수 ${result.inserted}명 등록 완료`);
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

      // IBC 서식 감지: row[9][0]이 숫자(순번)인지 확인
      const isIBCFormat = rawRows.length > 10 && typeof rawRows[10]?.[0] === "number";

      if (isIBCFormat) {
        // IBC 단체접수 서식
        const excelRows: Array<{ name: string; phone: string; company: string; grade: string; division: string }> = [];
        for (let i = 10; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row[0] || isNaN(Number(row[0]))) continue;
          const name = String(row[1] ?? "").trim();
          const division = String(row[10] ?? "").trim();
          if (!name || !division) continue;
          excelRows.push({ name, phone: String(row[5] ?? "").trim(), company: String(row[2] ?? "").trim(), grade: String(row[8] ?? "").trim(), division });
        }
        const divs = [...new Set(excelRows.map((r) => r.division))];
        const map: Record<string, string> = {};
        for (const div of divs) {
          const matched = categories.find((c) => c.name === div || div.includes(c.name));
          if (matched) map[div] = matched.id;
        }
        const result = await api("/api/judge/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "excel-rows", rows: excelRows, category_map: map, fallback_category_id: filterCatId || category?.id }),
        });
        onMsg(`IBC 서식에서 선수 ${result.inserted}명 등록 완료`);
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

  const deleteContestant = async (id: string) => {
    if (!confirm("선수를 삭제하시겠습니까?")) return;
    try { await api(`/api/judge/contestants/${id}`, { method: "DELETE" }); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
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
      {/* 종목 필터 탭 */}
      {categories.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1 flex-wrap">
          <button onClick={() => setFilterCatId("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filterCatId === "" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            전체 ({allContestants.length}명)
          </button>
          {categories.map((cat) => {
            const cnt = allContestants.filter((c) => c.category_id === cat.id).length;
            return (
              <button key={cat.id} onClick={() => setFilterCatId(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${filterCatId === cat.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {cat.name} ({cnt})
              </button>
            );
          })}
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex gap-2 flex-wrap">
        {competition?.contest_slug && (
          <button onClick={loadImportAthletes} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            📋 신청서에서 불러오기
          </button>
        )}
        <button onClick={loadDataFiles} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          📁 단체접수 파일
        </button>
        <label className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 cursor-pointer">
          📊 엑셀 업로드
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcel(f); e.target.value = ""; }} />
        </label>
      </div>

      {/* data-file 폴더 Import UI */}
      {showDataFile && (
        <div className="border border-purple-200 rounded-xl bg-purple-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-purple-800">단체접수 파일 ({dataFiles.length}개 / 총 {dataFiles.reduce((s, f) => s + f.rows.length, 0)}행)</p>
            <button onClick={() => setShowDataFile(false)} className="text-xs text-gray-400 hover:text-gray-600">닫기</button>
          </div>

          {/* 종목 매핑 */}
          <div className="mb-3 bg-white rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">세부종목 → 등록 종목 매핑:</p>
            {[...new Set(dataFiles.flatMap((f) => f.divisions))].sort().map((div) => (
              <div key={div} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-gray-700 truncate">{div}</span>
                <span className="text-gray-400">→</span>
                <select value={dataFileCatMap[div] ?? ""} onChange={(e) => setDataFileCatMap((m) => ({ ...m, [div]: e.target.value }))} className="border rounded px-2 py-1 text-xs">
                  <option value="">등록 안 함</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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

      {/* 선수 목록 — 종목별 테이블 */}
      {contestants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          {allContestants.length === 0 ? "등록된 선수가 없습니다. 신청서 또는 단체접수 파일에서 불러오세요." : "이 종목에 등록된 선수가 없습니다."}
        </p>
      ) : (() => {
        const groups: Array<{ catName: string; catId: string; rows: typeof contestants }> = [];
        if (filterCatId) {
          groups.push({ catName: categories.find((c) => c.id === filterCatId)?.name ?? "", catId: filterCatId, rows: contestants });
        } else {
          const grouped = new Map<string, { catName: string; catId: string; rows: typeof contestants }>();
          for (const c of contestants) {
            const catId = c.category_id;
            const catName = (c as Contestant & { category_name?: string }).category_name ?? "미분류";
            if (!grouped.has(catId)) grouped.set(catId, { catName, catId, rows: [] });
            grouped.get(catId)!.rows.push(c);
          }
          grouped.forEach((v) => groups.push(v));
        }
        return (
          <div className="space-y-5">
            {groups.map(({ catName, catId, rows }) => (
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
                              <span className="text-xs font-bold text-white bg-blue-500 rounded-full w-6 h-6 inline-flex items-center justify-center">{c.number}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                          <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{c.company ?? "-"}</td>
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
        );
      })()}
    </div>
  );
}

// ─── JudgesTab ────────────────────────────────────────────────
function JudgesTab({ competition, categories, onMsg }: { category: Category | null; competition: Competition | null; categories: Category[]; onMsg: (m: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [importJudges, setImportJudges] = useState<ImportJudge[]>([]);
  const [showImport, setShowImport] = useState(false);
  // { judgeId → { paid, categoryId, title } }
  const [judgeConfig, setJudgeConfig] = useState<Record<string, { paid: boolean; categoryId: string; title: string }>>({});
  // 배정 완료된 심사위원 목록 (전체 카테고리)
  const [allAssignments, setAllAssignments] = useState<(Assignment & { category_name?: string })[]>([]);

  const loadAssignments = useCallback(async () => {
    // 모든 카테고리의 배정 목록 합산
    const results: (Assignment & { category_name?: string })[] = [];
    for (const cat of categories) {
      try {
        const data = await api(`/api/judge/assignments?category_id=${cat.id}`);
        results.push(...data.map((a: Assignment) => ({ ...a, category_name: cat.name })));
      } catch { /* ignore */ }
    }
    setAllAssignments(results);
  }, [categories]);

  useEffect(() => { if (categories.length > 0) loadAssignments(); }, [loadAssignments, categories]);

  const loadImportJudges = async () => {
    if (!competition?.contest_slug) { onMsg("신청서와 연결된 대회가 아닙니다."); return; }
    try {
      const data = await api(`/api/judge/import?action=data&contest_slug=${competition.contest_slug}`);
      setImportJudges(data.judges);
      const config: Record<string, { paid: boolean; categoryId: string; title: string }> = {};
      for (const j of data.judges as ImportJudge[]) {
        const firstCat = j.categories[0] ?? "";
        const matched = categories.find((c) => c.name === firstCat || firstCat.startsWith(c.name) || c.name.startsWith(firstCat.split("(")[0]));
        config[j.id] = { paid: false, categoryId: matched?.id ?? (categories[0]?.id ?? ""), title: j.title || "심사위원" };
      }
      setJudgeConfig(config);
      setShowImport(true);
    } catch (e: unknown) { onMsg((e as Error).message); }
  };

  const setPaid = (id: string, paid: boolean) =>
    setJudgeConfig((prev) => ({ ...prev, [id]: { ...prev[id], paid } }));
  const setCfg = (id: string, field: "categoryId" | "title", val: string) =>
    setJudgeConfig((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const bulkAssign = async () => {
    const toAssign = importJudges.filter((j) => judgeConfig[j.id]?.paid && judgeConfig[j.id]?.categoryId);
    if (toAssign.length === 0) { onMsg("입금 확인 + 종목 선택된 심사위원이 없습니다."); return; }
    setLoading(true);
    try {
      const list = toAssign.map((j) => ({ email: j.email, category_id: judgeConfig[j.id].categoryId, title: judgeConfig[j.id].title }));
      const result = await api("/api/judge/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "judges", assignments: list }) });
      const errMsg = result.errors?.length > 0 ? ` (미배정: ${result.errors.length}명)` : "";
      onMsg(`심사위원 ${result.inserted}명 배정 완료${errMsg}`);
      setShowImport(false);
      await loadAssignments();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const addJudgeDirect = async () => {
    if (!email.trim() || categories.length === 0) return;
    setLoading(true);
    try {
      await api("/api/judge/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), category_id: categories[0].id }) });
      setEmail(""); await loadAssignments();
    } catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const removeJudge = async (id: string) => {
    try { await api("/api/judge/assignments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await loadAssignments(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  const paidCount = Object.values(judgeConfig).filter((c) => c.paid).length;

  return (
    <div className="space-y-4">
      {competition?.contest_slug && (
        <button onClick={loadImportJudges} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
          📋 신청서에서 불러오기
        </button>
      )}

      {/* 신청서 Import UI — 결제 확인 우선 흐름 */}
      {showImport && (
        <div className="border border-green-200 rounded-xl bg-green-50 p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-green-800">심사위원 신청서 목록 ({importJudges.length}명)</p>
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
                  <th className="px-3 py-2 text-left font-medium">신청종목</th>
                  <th className="px-3 py-2 text-left font-medium max-w-[180px]">경력</th>
                  <th className="px-3 py-2 text-center font-medium w-20">입금확인</th>
                  <th className="px-3 py-2 text-left font-medium">배정종목</th>
                  <th className="px-3 py-2 text-left font-medium">배정직책</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {importJudges.map((j) => {
                  const cfg = judgeConfig[j.id] ?? { paid: false, categoryId: "", title: "심사위원" };
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
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {j.categories.map((c) => <span key={c} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap">{c}</span>)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[180px]">
                        <span className="line-clamp-2">{j.career}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <label className={`inline-flex flex-col items-center gap-1 cursor-pointer px-2 py-1 rounded-lg transition ${cfg.paid ? "bg-green-100" : "bg-gray-50 hover:bg-gray-100"}`}>
                          <input type="checkbox" className="w-4 h-4 accent-green-600" checked={cfg.paid}
                            onChange={(e) => setPaid(j.id, e.target.checked)} />
                          <span className={`text-xs font-medium whitespace-nowrap ${cfg.paid ? "text-green-700" : "text-gray-400"}`}>
                            {cfg.paid ? "입금✓" : "미확인"}
                          </span>
                        </label>
                      </td>
                      <td className="px-3 py-2.5">
                        {cfg.paid && (
                          <select value={cfg.categoryId} onChange={(e) => setCfg(j.id, "categoryId", e.target.value)}
                            className="border rounded px-2 py-1.5 text-xs font-medium text-gray-700 w-full min-w-[100px]">
                            <option value="">종목 선택</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {cfg.paid && (
                          <select value={cfg.title} onChange={(e) => setCfg(j.id, "title", e.target.value)}
                            className="border rounded px-2 py-1.5 text-xs font-medium text-gray-700">
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
            <span className="text-xs text-gray-600">입금 확인: <strong className="text-green-700">{paidCount}명</strong> / {importJudges.length}명</span>
            <button onClick={bulkAssign} disabled={loading || paidCount === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? "배정 중..." : `입금확인 ${paidCount}명 일괄 배정`}
            </button>
          </div>
        </div>
      )}

      {/* 배정된 심사위원 목록 (전체 종목) — 테이블 */}
      {allAssignments.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">배정 완료 심사위원</span>
            <span className="text-xs text-gray-400">{allAssignments.length}명</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 border-b">
                  <th className="px-3 py-2 text-left font-medium">종목</th>
                  <th className="px-3 py-2 text-left font-medium">이름</th>
                  <th className="px-3 py-2 text-left font-medium">이메일</th>
                  <th className="px-3 py-2 text-left font-medium">직책</th>
                  <th className="px-3 py-2 text-center w-12 font-medium">해제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs">
                      {a.category_name && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">{a.category_name}</span>}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{a.users?.name ?? "(이름 없음)"}</td>
                    <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{a.users?.email}</td>
                    <td className="px-3 py-2 text-xs">
                      {a.title && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">{a.title}</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => removeJudge(a.id)} className="text-xs text-red-400 hover:text-red-600">해제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {allAssignments.length === 0 && !showImport && <p className="text-sm text-gray-400">배정된 심사위원이 없습니다.</p>}

      <div className="flex gap-2 pt-2 border-t">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일로 직접 추가 (첫 번째 종목에 배정)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addJudgeDirect()} />
        <button onClick={addJudgeDirect} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">배정</button>
      </div>
    </div>
  );
}

// ─── CriteriaTab ──────────────────────────────────────────────
function CriteriaTab({ category, onMsg }: { category: Category | null; onMsg: (m: string) => void }) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [loading, setLoading] = useState(false);
  const [seedType, setSeedType] = useState<"출품" | "대면">("출품");
  const [seeding, setSeeding] = useState(false);

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
  if (!category) return <p className="text-sm text-gray-400">종목을 먼저 선택하세요.</p>;

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
          <button onClick={seedCriteria} disabled={seeding} className="px-5 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {seeding ? "등록 중..." : `"${category.name}" 자동 설정`}
          </button>
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

          {activeTab === "criteria" && <CriteriaTab category={selectedCategory} onMsg={setMsg} />}
          {activeTab === "awards" && <AwardsTab category={selectedCategory} competition={selectedCompetition} onMsg={setMsg} />}
        </div>
      </div>
    </div>
  );
}
