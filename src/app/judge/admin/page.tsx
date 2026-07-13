"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────
interface Competition { id: string; title: string; description?: string; date_display?: string; status: string; allow_contestant_upload: boolean; }
interface Category { id: string; competition_id: string; name: string; display_order: number; }
interface Contestant { id: string; category_id: string; name: string; phone?: string; email?: string; display_order: number; contestant_files?: ContestantFile[]; }
interface ContestantFile { id: string; contestant_id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
interface Criterion { id: string; category_id: string; name: string; max_score: number; display_order: number; }
interface Assignment { id: string; user_id: string; category_id: string; users: { email: string; name?: string; }; }
interface Award { id: string; category_id: string; award_name: string; count: number | null; display_order: number; }

type Tab = "competitions" | "contestants" | "judges" | "criteria" | "awards";

const TABS: { key: Tab; label: string }[] = [
  { key: "competitions", label: "대회·종목" },
  { key: "contestants", label: "선수·파일" },
  { key: "judges", label: "심사위원 배정" },
  { key: "criteria", label: "채점 항목" },
  { key: "awards", label: "시상 설정" },
];

// ─── Helpers ──────────────────────────────────────────────────
const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "오류 발생");
  }
  return res.json();
};

// ─── Sub-components ───────────────────────────────────────────

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
    if (!confirm("종목을 삭제하면 선수·채점·배정 데이터가 모두 삭제됩니다. 계속하시겠습니까?")) return;
    try { await api(`/api/judge/categories/${id}`, { method: "DELETE" }); onSelectCategory(null); onRefresh(); }
    catch (e: unknown) { setMsg((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      {msg && <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-4 py-2">{msg}</p>}

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-800 mb-4">대회 목록</h3>
        <div className="space-y-2 mb-4">
          {competitions.map((c) => (
            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${selectedCompetition?.id === c.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => { onSelectCompetition(c); onSelectCategory(null); }}>
              <div>
                <span className="font-medium text-gray-900">{c.title}</span>
                {c.date_display && <span className="text-xs text-gray-400 ml-2">{c.date_display}</span>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteCompetition(c.id); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">삭제</button>
            </div>
          ))}
          {competitions.length === 0 && <p className="text-sm text-gray-400">등록된 대회가 없습니다.</p>}
        </div>
        <div className="flex gap-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="대회명" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCompetition()} />
          <input value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="날짜 (예: 2026년 7월 15일)" className="w-44 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={addCompetition} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
        </div>
      </div>

      {selectedCompetition && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-800 mb-1">종목 — {selectedCompetition.title}</h3>
          <p className="text-xs text-gray-400 mb-4">종목을 선택하면 다른 탭에서 선수·심사위원 관리가 가능합니다.</p>
          <div className="space-y-2 mb-4">
            {categories.map((cat) => (
              <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${selectedCategory?.id === cat.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => onSelectCategory(cat)}>
                <span className="font-medium text-gray-900">{cat.name}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">삭제</button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-400">등록된 종목이 없습니다.</p>}
          </div>
          <div className="flex gap-2">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="종목명 (예: 헤어아트)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            <button onClick={addCategory} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function ContestantsTab({ category, onMsg }: { category: Category | null; onMsg: (m: string) => void }) {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ytInputId, setYtInputId] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState("");

  const load = useCallback(async () => {
    if (!category) return;
    try { const data = await api(`/api/judge/contestants?category_id=${category.id}`); setContestants(data); }
    catch { /* ignore */ }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const addContestant = async () => {
    if (!category || !newName.trim()) return;
    setLoading(true);
    try {
      await api("/api/judge/contestants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: category.id, name: newName.trim(), phone: newPhone.trim(), display_order: contestants.length }) });
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
      await load();
      onMsg(`${file.name} 업로드 완료`);
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

  if (!category) return <p className="text-sm text-gray-400">왼쪽 탭에서 종목을 먼저 선택하세요.</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="선수 이름" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addContestant()} />
        <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="연락처 (선택)" className="w-36 border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addContestant} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
      </div>

      <div className="space-y-3">
        {contestants.map((c) => (
          <div key={c.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-gray-900">{c.name}</span>
                {c.phone && <span className="text-xs text-gray-400 ml-2">{c.phone}</span>}
              </div>
              <button onClick={() => deleteContestant(c.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {(c.contestant_files ?? []).map((f) => (
                <div key={f.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1 text-xs">
                  {f.file_type === "youtube" ? "▶️" : f.file_type.startsWith("video") ? "🎬" : "🖼️"}
                  <span className="text-gray-700 max-w-[160px] truncate">{f.file_type === "youtube" ? `YouTube: ${getYouTubeId(f.video_url ?? "")}` : f.file_name}</span>
                  {f.file_type === "youtube" && f.video_url
                    ? <a href={f.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">보기</a>
                    : f.storage_path && <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/contestant-files/${f.storage_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">보기</a>
                  }
                  <button onClick={() => deleteFile(f.id, f.storage_path)} className="text-red-400 hover:text-red-600 ml-1">×</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${uploading === c.id ? "bg-gray-200 text-gray-400" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                {uploading === c.id ? "업로드 중..." : "+ 이미지/파일"}
                <input type="file" className="hidden" accept="image/*,video/*" disabled={uploading === c.id} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(c.id, file); e.target.value = ""; }} />
              </label>

              {ytInputId === c.id ? (
                <div className="flex gap-1 flex-1">
                  <input autoFocus value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://youtu.be/... 또는 youtube.com/watch?v=..." className="flex-1 border rounded-lg px-3 py-1.5 text-xs min-w-0" onKeyDown={(e) => { if (e.key === "Enter") addYouTubeUrl(c.id); if (e.key === "Escape") { setYtInputId(null); setYtUrl(""); } }} />
                  <button onClick={() => addYouTubeUrl(c.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">등록</button>
                  <button onClick={() => { setYtInputId(null); setYtUrl(""); }} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs">취소</button>
                </div>
              ) : (
                <button onClick={() => { setYtInputId(c.id); setYtUrl(""); }} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition">▶ YouTube URL</button>
              )}
            </div>
          </div>
        ))}
        {contestants.length === 0 && <p className="text-sm text-gray-400">등록된 선수가 없습니다.</p>}
      </div>
    </div>
  );
}

function JudgesTab({ category, onMsg }: { category: Category | null; onMsg: (m: string) => void }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!category) return;
    try { const data = await api(`/api/judge/assignments?category_id=${category.id}`); setAssignments(data); }
    catch { /* ignore */ }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const addJudge = async () => {
    if (!category || !email.trim()) return;
    setLoading(true);
    try { await api("/api/judge/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), category_id: category.id }) }); setEmail(""); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
    setLoading(false);
  };

  const removeJudge = async (id: string) => {
    try { await api("/api/judge/assignments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
    catch (e: unknown) { onMsg((e as Error).message); }
  };

  if (!category) return <p className="text-sm text-gray-400">종목을 먼저 선택하세요.</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="심사위원 이메일 (Google 계정)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addJudge()} />
        <button onClick={addJudge} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">배정</button>
      </div>
      <div className="space-y-2">
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <div>
              <span className="font-medium text-gray-800">{a.users?.name ?? "(이름 없음)"}</span>
              <span className="text-xs text-gray-400 ml-2">{a.users?.email}</span>
            </div>
            <button onClick={() => removeJudge(a.id)} className="text-xs text-red-400 hover:text-red-600">배정 해제</button>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-sm text-gray-400">배정된 심사위원이 없습니다.</p>}
      </div>
    </div>
  );
}

function CriteriaTab({ category, onMsg }: { category: Category | null; onMsg: (m: string) => void }) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!category) return;
    try { const data = await api(`/api/judge/criteria?category_id=${category.id}`); setCriteria(data); }
    catch { /* ignore */ }
  }, [category]);

  useEffect(() => { load(); }, [load]);

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
      {criteria.length > 0 && (
        <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
          총 배점: <strong>{total}점</strong>
        </div>
      )}
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
        {criteria.length === 0 && <p className="text-sm text-gray-400">등록된 채점 항목이 없습니다.</p>}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="항목명 (예: 기술력)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addCriterion()} />
        <input value={newMax} onChange={(e) => setNewMax(e.target.value)} type="number" min="1" max="1000" placeholder="배점" className="w-20 border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addCriterion} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">추가</button>
      </div>
    </div>
  );
}

function AwardsTab({ category, onMsg }: { category: Category | null; onMsg: (m: string) => void }) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [newName, setNewName] = useState("");
  const [newCount, setNewCount] = useState("1");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!category) return;
    try { const data = await api(`/api/judge/awards?category_id=${category.id}`); setAwards(data); }
    catch { /* ignore */ }
  }, [category]);

  useEffect(() => { load(); }, [load]);

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

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">점수 상위 순서대로 시상이 배분됩니다.</p>
      <div className="space-y-2">
        {awards.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <span className="font-medium text-gray-800">{a.award_name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{a.count}명</span>
              <button onClick={() => deleteAward(a.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>
          </div>
        ))}
        {awards.length === 0 && <p className="text-sm text-gray-400">등록된 시상이 없습니다.</p>}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="시상명 (예: 금상)" className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addAward()} />
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

  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(""), 4000); return () => clearTimeout(t); } }, [msg]);

  const handleRefresh = () => { loadCompetitions(); loadCategories(); };

  const contextLabel = selectedCategory
    ? `${selectedCompetition?.title} > ${selectedCategory.name}`
    : selectedCompetition
    ? `${selectedCompetition.title} (종목 선택 필요)`
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

        {msg && (
          <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{msg}</div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === t.key ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Context indicator */}
        {activeTab !== "competitions" && (
          <div className="mb-4 px-4 py-2 bg-gray-100 rounded-lg text-xs text-gray-600">
            현재 선택: <strong>{contextLabel}</strong>
            {!selectedCategory && <span className="ml-2 text-amber-600">← 대회·종목 탭에서 종목을 선택해주세요</span>}
          </div>
        )}

        {/* Tab content */}
        <div>
          {activeTab === "competitions" && (
            <CompetitionsTab
              competitions={competitions}
              categories={categories}
              selectedCompetition={selectedCompetition}
              selectedCategory={selectedCategory}
              onSelectCompetition={(c) => { setSelectedCompetition(c); if (c?.id !== selectedCompetition?.id) setSelectedCategory(null); }}
              onSelectCategory={setSelectedCategory}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === "contestants" && <ContestantsTab category={selectedCategory} onMsg={setMsg} />}
          {activeTab === "judges" && <JudgesTab category={selectedCategory} onMsg={setMsg} />}
          {activeTab === "criteria" && <CriteriaTab category={selectedCategory} onMsg={setMsg} />}
          {activeTab === "awards" && <AwardsTab category={selectedCategory} onMsg={setMsg} />}
        </div>
      </div>
    </div>
  );
}
