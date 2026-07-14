"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const MERGE_GROUPS: { key: string; displayName: string; names: string[] }[] = [
  { key: "mg_블로드라이", displayName: "블로드라이", names: ["블로드라이", "블로드라이(인컬)", "블로드라이(아웃컬)"] },
  { key: "mg_원랭스", displayName: "원랭스", names: ["원랭스(스파니엘)", "원랭스(이사도라)", "원랭스(그래듀에이션)"] },
  { key: "mg_살롱헤어커트", displayName: "살롱헤어커트", names: ["살롱헤어커트", "살롱헤어커트(맨즈컷)"] },
  { key: "mg_바디관리", displayName: "바디관리", names: ["바디관리(다리)", "바디관리(등)", "바디관리(팔)"] },
  { key: "mg_아트", displayName: "아트", names: ["살롱매니아트", "창작아트", "패디아트"] },
  { key: "mg_스캅취", displayName: "스캅취", names: ["아크릴프렌치스캅취", "젤원톤스캅취"] },
  { key: "mg_왁싱바디", displayName: "바디", names: ["바디(겨드랑이)", "바디(팔)"] },
];

const NAME_TO_MERGE_KEY = new Map<string, string>();
for (const g of MERGE_GROUPS) for (const name of g.names) NAME_TO_MERGE_KEY.set(name, g.key);

interface Category { id: string; name: string; major_category?: string; competition_id: string; }
interface Competition { id: string; title: string; }
interface ContestantFile { id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
interface Contestant { id: string; name: string; number?: number; contestant_files?: ContestantFile[]; _categoryId?: string; _categoryName?: string; }
interface Criterion { id: string; name: string; max_score: number; display_order: number; }
interface Tab { key: string; displayName: string; categoryIds: string[]; categoryNames: string[]; majorCategory: string; competition: Competition; }
type Assignment = { id: string; category: Category & { competitions: Competition } };
type ScoreMap = { [contestantId: string]: { [criterionId: string]: { score: string; comment: string } } };
type Preview = { kind: "photo"; url: string } | { kind: "youtube"; id: string } | { kind: "video"; url: string };

function buildTabs(assignments: Assignment[]): Tab[] {
  const tabs: Tab[] = [];
  const seen = new Map<string, Tab>();
  for (const a of assignments) {
    const mergeKey = NAME_TO_MERGE_KEY.get(a.category.name);
    if (mergeKey) {
      if (seen.has(mergeKey)) {
        seen.get(mergeKey)!.categoryIds.push(a.category.id);
        seen.get(mergeKey)!.categoryNames.push(a.category.name);
      } else {
        const g = MERGE_GROUPS.find((x) => x.key === mergeKey)!;
        const tab: Tab = { key: mergeKey, displayName: g.displayName, categoryIds: [a.category.id], categoryNames: [a.category.name], majorCategory: a.category.major_category ?? "기타", competition: a.category.competitions };
        seen.set(mergeKey, tab);
        tabs.push(tab);
      }
    } else {
      tabs.push({ key: a.category.id, displayName: a.category.name, categoryIds: [a.category.id], categoryNames: [a.category.name], majorCategory: a.category.major_category ?? "기타", competition: a.category.competitions });
    }
  }
  return tabs;
}

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? res.statusText); }
  return res.json();
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function PhotoCell({ files, onSelect, activeUrl }: { files: ContestantFile[]; onSelect: (url: string) => void; activeUrl: string | null }) {
  const images = files.filter((f) => f.file_type.startsWith("image") && f.storage_path);
  if (images.length === 0) return <span className="text-gray-300 text-xs">-</span>;
  return (
    <div className="flex gap-1 flex-wrap">
      {images.map((f) => {
        const url = `${SUPABASE_URL}/storage/v1/object/public/contestant-files/${f.storage_path}`;
        const isActive = activeUrl === url;
        return (
          <button key={f.id} onClick={() => onSelect(isActive ? "" : url)} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={f.file_name}
              className={`w-14 h-14 object-cover rounded border-2 transition ${isActive ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200 hover:border-blue-300 hover:opacity-80"}`} />
          </button>
        );
      })}
    </div>
  );
}

function VideoCell({ files, onSelect }: { files: ContestantFile[]; onSelect: (v: Preview) => void }) {
  const ytFiles = files.filter((f) => f.file_type === "youtube" && f.video_url);
  const videoFiles = files.filter((f) => f.file_type.startsWith("video") && f.storage_path);
  if (ytFiles.length === 0 && videoFiles.length === 0) return <span className="text-gray-300 text-xs">-</span>;
  const ytId = ytFiles[0] ? getYouTubeId(ytFiles[0].video_url!) : null;
  const handleClick = () => {
    if (ytId) onSelect({ kind: "youtube", id: ytId });
    else if (videoFiles[0]) onSelect({ kind: "video", url: `${SUPABASE_URL}/storage/v1/object/public/contestant-files/${videoFiles[0].storage_path}` });
  };
  return (
    <button onClick={handleClick} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition">
      ▶ 재생
    </button>
  );
}

export default function JudgeScorePage() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [selectedTabKey, setSelectedTabKey] = useState<string | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [submitted, setSubmitted] = useState<{ [categoryId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string>("");
  const [videoFullscreen, setVideoFullscreen] = useState<Preview | null>(null);

  const saveTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const scoresRef = useRef<ScoreMap>({});
  const criteriaRef = useRef<Criterion[]>([]);
  const tabsRef = useRef<Tab[]>([]);
  const contestantCategoryMapRef = useRef<{ [contestantId: string]: string }>({});

  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { criteriaRef.current = criteria; }, [criteria]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/judge/my-assignments");
        if (!res.ok) { window.location.href = "/judge"; return; }
        const data = await res.json();
        const builtTabs = buildTabs(data.assignments ?? []);
        tabsRef.current = builtTabs;
        setTabs(builtTabs);
        if (builtTabs.length > 0) setSelectedTabKey(builtTabs[0].key);
        setSubmitted(data.submitted ?? {});
      } catch { window.location.href = "/judge"; }
      setLoading(false);
    })();
  }, []);

  const loadTab = useCallback(async (tab: Tab) => {
    setCatLoading(true);
    try {
      const [contestantArrays, crs, scoreArrays] = await Promise.all([
        Promise.all(tab.categoryIds.map((catId) => api(`/api/judge/contestants?category_id=${catId}`))),
        api(`/api/judge/criteria?category_id=${tab.categoryIds[0]}`),
        Promise.all(tab.categoryIds.map((catId) => api(`/api/judge/scores?category_id=${catId}`))),
      ]);

      const catMap: { [id: string]: string } = {};
      const allContestants: Contestant[] = [];
      for (let i = 0; i < tab.categoryIds.length; i++) {
        const catId = tab.categoryIds[i];
        const catName = tab.categoryNames[i];
        for (const c of contestantArrays[i]) {
          catMap[c.id] = catId;
          allContestants.push({ ...c, _categoryId: catId, _categoryName: catName });
        }
      }
      // 종목 순서 유지, 각 종목 내 번호 순
      allContestants.sort((a, b) => {
        const ai = tab.categoryIds.indexOf(a._categoryId ?? "");
        const bi = tab.categoryIds.indexOf(b._categoryId ?? "");
        if (ai !== bi) return ai - bi;
        return (a.number ?? 0) - (b.number ?? 0);
      });
      contestantCategoryMapRef.current = catMap;

      const map: ScoreMap = {};
      for (const scs of scoreArrays) {
        for (const s of scs) {
          if (!map[s.contestant_id]) map[s.contestant_id] = {};
          map[s.contestant_id][s.criterion_id] = { score: String(s.score), comment: s.comment ?? "" };
        }
      }
      setContestants(allContestants);
      setCriteria(crs);
      setScores(map);
    } catch (e: unknown) { setMsg((e as Error).message); }
    setCatLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTabKey) {
      const tab = tabsRef.current.find((t) => t.key === selectedTabKey);
      if (tab) { setPreview(null); setFullscreenUrl(""); loadTab(tab); }
    }
  }, [selectedTabKey, loadTab]);

  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(""), 4000); return () => clearTimeout(t); }
  }, [msg]);

  const handleChange = (contestantId: string, criterionId: string, value: string) => {
    setScores((prev) => ({
      ...prev,
      [contestantId]: { ...prev[contestantId], [criterionId]: { ...(prev[contestantId]?.[criterionId] ?? { score: "", comment: "" }), score: value } },
    }));
  };

  const handleSave = useCallback(async (contestantId: string, criterionId: string) => {
    const key = `${contestantId}_${criterionId}`;
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const categoryId = contestantCategoryMapRef.current[contestantId];
      if (!categoryId) return;
      const val = scoresRef.current[contestantId]?.[criterionId];
      if (!val || val.score === "") return;
      const scoreNum = parseFloat(val.score);
      const criterion = criteriaRef.current.find((c) => c.id === criterionId);
      if (!criterion || isNaN(scoreNum) || scoreNum < 0 || scoreNum > criterion.max_score) return;
      try {
        await api("/api/judge/scores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contestant_id: contestantId, criterion_id: criterionId, score: scoreNum, comment: "", category_id: categoryId }) });
      } catch (e: unknown) { setMsg((e as Error).message); }
    }, 800);
  }, []);

  const handleSubmit = async () => {
    const currentTab = tabsRef.current.find((t) => t.key === selectedTabKey);
    if (!currentTab) return;
    if (!confirm("채점을 제출하면 이후 수정이 불가능합니다. 제출하시겠습니까?")) return;
    setSubmitting(true);
    try {
      await Promise.all(currentTab.categoryIds.map((catId) =>
        api("/api/judge/scores/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: catId }) })
      ));
      setSubmitted((prev) => {
        const next = { ...prev };
        for (const catId of currentTab.categoryIds) next[catId] = true;
        return next;
      });
      setMsg("채점이 제출되었습니다.");
    } catch (e: unknown) { setMsg((e as Error).message); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">로딩 중...</div>;

  const currentTab = tabsRef.current.find((t) => t.key === selectedTabKey);
  const isSubmitted = currentTab ? currentTab.categoryIds.every((id) => submitted[id]) : false;
  const isMultiCat = (currentTab?.categoryIds.length ?? 0) > 1;

  const hasPhotos = contestants.some((c) => (c.contestant_files ?? []).some((f) => f.file_type.startsWith("image") && f.storage_path));
  const hasVideos = contestants.some((c) => (c.contestant_files ?? []).some((f) => (f.file_type === "youtube" && f.video_url) || (f.file_type.startsWith("video") && f.storage_path)));

  const maxTotal = criteria.reduce((s, cr) => s + cr.max_score, 0);
  const totals = contestants.map((c) => ({
    id: c.id,
    total: criteria.reduce((sum, cr) => { const v = parseFloat(scores[c.id]?.[cr.id]?.score ?? ""); return sum + (isNaN(v) ? 0 : v); }, 0),
  }));
  const sorted = [...totals].sort((a, b) => b.total - a.total);
  const rankMap: { [id: string]: number } = {};
  sorted.forEach((item) => { if (item.total > 0) rankMap[item.id] = sorted.findIndex((x) => x.total === item.total) + 1; });

  const totalFilled = criteria.length > 0
    ? contestants.filter((c) => criteria.every((cr) => { const v = scores[c.id]?.[cr.id]?.score; return v !== undefined && v !== ""; })).length
    : 0;

  const tabGroups = new Map<string, Tab[]>();
  for (const tab of tabs) {
    const major = tab.majorCategory;
    if (!tabGroups.has(major)) tabGroups.set(major, []);
    tabGroups.get(major)!.push(tab);
  }
  const isMultiGroup = tabGroups.size > 1;
  const colCount = 1 + (hasPhotos ? 1 : 0) + (hasVideos ? 1 : 0) + Math.max(criteria.length, 1) + 2;
  const activePhotoUrl = preview?.kind === "photo" ? preview.url : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚖️ 심사 채점</h1>

        {msg && <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{msg}</div>}

        {/* 종목 탭 */}
        {tabs.length > 0 && (
          <div className={`mb-6 ${isMultiGroup ? "space-y-2" : ""}`}>
            {[...tabGroups.entries()].map(([major, groupTabs]) => (
              <div key={major} className={isMultiGroup ? "flex items-start gap-3" : "flex gap-2 flex-wrap"}>
                {isMultiGroup && (
                  <div className="shrink-0 w-20 flex justify-center pt-0.5">
                    <span className="text-xs font-bold text-white bg-purple-600 px-2.5 py-1 rounded-full whitespace-nowrap">{major}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {groupTabs.map((tab) => (
                    <button key={tab.key} onClick={() => setSelectedTabKey(tab.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                        selectedTabKey === tab.key ? "bg-blue-600 text-white shadow" : "bg-white border text-gray-700 hover:border-blue-300"
                      }`}>
                      {tab.displayName}
                      {tab.categoryIds.length > 0 && tab.categoryIds.every((id) => submitted[id]) && (
                        <span className="ml-1.5 text-xs opacity-75">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentTab && (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{currentTab.competition.title}</p>
              <h2 className="text-lg font-semibold text-gray-800">{currentTab.displayName}</h2>
            </div>
            {isSubmitted && <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">✅ 제출완료</span>}
          </div>
        )}

        {catLoading ? (
          <div className="text-center py-16 text-gray-400">로딩 중...</div>
        ) : contestants.length === 0 ? (
          <div className="text-center py-16 text-gray-400">등록된 선수가 없습니다.</div>
        ) : (
          <div className="flex gap-4 items-start">

            {/* 왼쪽: 사진 / 영상 패널 */}
            {preview && (
              <div className="sticky top-20 shrink-0 w-80 xl:w-96">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">
                      {preview.kind === "photo" ? "작품 사진" : "영상"}
                    </span>
                    <div className="flex items-center gap-2">
                      {preview.kind !== "photo" && (
                        <button
                          onClick={() => setVideoFullscreen(preview)}
                          className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-50 transition"
                          title="크게 보기"
                        >
                          🔲 크게
                        </button>
                      )}
                      <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
                    </div>
                  </div>
                  {preview.kind === "photo" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.url}
                      alt="작품사진"
                      className="w-full object-contain max-h-[70vh] cursor-zoom-in"
                      title="클릭하면 원본 크기로 볼 수 있습니다"
                      onClick={() => setFullscreenUrl(preview.url)}
                    />
                  )}
                  {preview.kind === "youtube" && (
                    <div className="relative" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${preview.id}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                        title="영상"
                      />
                    </div>
                  )}
                  {preview.kind === "video" && (
                    <video src={preview.url} controls autoPlay className="w-full bg-black">
                      <track kind="captions" />
                    </video>
                  )}
                </div>
              </div>
            )}

            {/* 오른쪽: 채점 테이블 */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap w-14">번호</th>
                      {hasPhotos && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">작품사진</th>}
                      {hasVideos && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">영상</th>}
                      {criteria.map((cr) => (
                        <th key={cr.id} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">
                          {cr.name}<div className="text-gray-400 font-normal">/{cr.max_score}</div>
                        </th>
                      ))}
                      {criteria.length === 0 && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">채점</th>}
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">총점{maxTotal > 0 ? `/${maxTotal}` : ""}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">등수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contestants.flatMap((c, idx) => {
                      const isFirstInGroup = idx === 0 || c._categoryId !== contestants[idx - 1]._categoryId;
                      const rank = rankMap[c.id];
                      const cTotal = totals.find((t) => t.id === c.id)!.total;

                      const isCatSubmitted = isMultiCat && isFirstInGroup && submitted[c._categoryId ?? ""];
                      const separatorRow = isMultiCat && isFirstInGroup ? (
                        <tr key={`sep_${c._categoryId}_${idx}`} className={isCatSubmitted ? "bg-green-50/60" : "bg-amber-50/50"}>
                          <td colSpan={colCount} className={`px-4 py-1.5 border-b ${isCatSubmitted ? "border-green-100" : "border-amber-100"}`}>
                            <span className={`text-xs font-semibold pl-2 border-l-2 ${isCatSubmitted ? "text-green-600 border-green-400" : "text-amber-600 border-amber-400"}`}>
                              {c._categoryName} {isCatSubmitted ? "✅ 제출완료" : "⏳ 미제출"}
                            </span>
                          </td>
                        </tr>
                      ) : null;

                      const mainRow = (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50/20 transition">
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold">{c.number}</span>
                          </td>
                          {hasPhotos && (
                            <td className="px-3 py-3 text-center">
                              <div className="flex justify-center">
                                <PhotoCell
                                  files={c.contestant_files ?? []}
                                  onSelect={(url) => setPreview(url ? { kind: "photo", url } : null)}
                                  activeUrl={activePhotoUrl}
                                />
                              </div>
                            </td>
                          )}
                          {hasVideos && (
                            <td className="px-3 py-3 text-center">
                              <VideoCell files={c.contestant_files ?? []} onSelect={setPreview} />
                            </td>
                          )}
                          {criteria.length > 0 ? criteria.map((cr) => {
                            const val = scores[c.id]?.[cr.id]?.score ?? "";
                            const num = parseFloat(val);
                            const valid = !isNaN(num) && num >= 0 && num <= cr.max_score;
                            return (
                              <td key={cr.id} className="px-2 py-3 text-center">
                                <input type="number" min={0} max={cr.max_score} value={val} disabled={isSubmitted}
                                  onChange={(e) => handleChange(c.id, cr.id, e.target.value)}
                                  onBlur={() => valid && handleSave(c.id, cr.id)}
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 text-sm font-medium
                                    ${isSubmitted ? "bg-gray-50 text-gray-400 border-gray-200"
                                      : valid && val !== "" ? "border-blue-400 bg-blue-50 text-blue-800"
                                      : val !== "" && !valid ? "border-red-400 bg-red-50"
                                      : "border-gray-300 focus:border-blue-400 focus:outline-none"}`}
                                  placeholder={`/${cr.max_score}`} />
                              </td>
                            );
                          }) : (
                            <td className="px-3 py-3 text-center text-xs text-gray-400">채점항목<br />미설정</td>
                          )}
                          <td className="px-3 py-3 text-center">
                            {criteria.length > 0 ? (
                              <div className={`text-xl font-bold ${cTotal > 0 ? "text-blue-700" : "text-gray-300"}`}>{cTotal}</div>
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {rank ? (
                              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold
                                ${rank === 1 ? "bg-yellow-400 text-yellow-900" : rank === 2 ? "bg-slate-400 text-white" : rank === 3 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                                {rank}등
                              </span>
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                        </tr>
                      );

                      return separatorRow ? [separatorRow, mainRow] : [mainRow];
                    })}
                  </tbody>
                </table>
              </div>

              {!isSubmitted && criteria.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-600">채점 완료: <strong className="text-blue-600">{totalFilled} / {contestants.length}명</strong></p>
                  <button onClick={handleSubmit} disabled={submitting || totalFilled < contestants.length}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {submitting ? "제출 중..." : "채점 제출"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 원본 사진 풀스크린 */}
      {fullscreenUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFullscreenUrl("")}>
          <div className="relative max-w-screen-xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fullscreenUrl} alt="원본사진" className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" />
            <button onClick={() => setFullscreenUrl("")}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 영상 풀스크린 팝업 */}
      {videoFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setVideoFullscreen(null)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {videoFullscreen.kind === "youtube" && (
              <div className="relative" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoFullscreen.id}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-lg"
                  title="영상"
                />
              </div>
            )}
            {videoFullscreen.kind === "video" && (
              <video src={videoFullscreen.url} controls autoPlay className="w-full rounded-lg bg-black">
                <track kind="captions" />
              </video>
            )}
            <button onClick={() => setVideoFullscreen(null)} className="mt-3 block mx-auto text-white/70 text-sm hover:text-white">✕ 닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
