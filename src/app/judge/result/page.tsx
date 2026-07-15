"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// 채점 페이지와 동일한 합치기 그룹
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

interface Competition { id: string; title: string; }
interface Category { id: string; name: string; competition_id: string; major_category?: string | null; }
interface ResultTab { key: string; displayName: string; categoryIds: string[]; categoryNames: string[]; majorCategory: string; }
interface Criterion { id: string; name: string; max_score: number; }
interface Judge { id: string; name: string; }
interface CriterionScore { criterion_id: string; criterion_name: string; max_score: number; avg: number | null; judge_count: number; }
interface ResultRow {
  id: string; name: string; phone?: string; grade?: string | null; number?: number | null;
  criteria_scores: CriterionScore[]; total: number | null; rank: number | null; award: string | null;
  _categoryName?: string;
}
interface Award { id: string; award_name: string; count: number | null; }
interface ContestantFile { id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
type Preview = { kind: "photo"; url: string } | { kind: "youtube"; id: string } | { kind: "video"; url: string };
type AdminJudge = { id: string; name: string; email: string; categories: { categoryId: string; submitted: boolean }[] };

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function PhotoCell({ files, onSelect, activeUrl }: { files: ContestantFile[]; onSelect: (url: string) => void; activeUrl: string | null }) {
  const images = files.filter((f) => f.file_type.startsWith("image") && f.storage_path);
  if (images.length === 0) return <span className="text-gray-300 text-xs">-</span>;
  return (
    <div className="flex gap-1 flex-wrap justify-center">
      {images.map((f) => {
        const url = `${SUPABASE_URL}/storage/v1/object/public/contestant-files/${f.storage_path}`;
        const isActive = activeUrl === url;
        return (
          <button key={f.id} onClick={() => onSelect(isActive ? "" : url)} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={f.file_name}
              className={`w-12 h-12 object-cover rounded border-2 transition ${isActive ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200 hover:border-blue-300 hover:opacity-80"}`} />
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

function buildResultTabs(categories: Category[]): ResultTab[] {
  const tabs: ResultTab[] = [];
  const seen = new Map<string, ResultTab>();
  for (const cat of categories) {
    const mergeKey = NAME_TO_MERGE_KEY.get(cat.name);
    if (mergeKey) {
      if (seen.has(mergeKey)) {
        seen.get(mergeKey)!.categoryIds.push(cat.id);
        seen.get(mergeKey)!.categoryNames.push(cat.name);
      } else {
        const g = MERGE_GROUPS.find((x) => x.key === mergeKey)!;
        const tab: ResultTab = { key: mergeKey, displayName: g.displayName, categoryIds: [cat.id], categoryNames: [cat.name], majorCategory: cat.major_category ?? "기타" };
        seen.set(mergeKey, tab);
        tabs.push(tab);
      }
    } else {
      tabs.push({ key: cat.id, displayName: cat.name, categoryIds: [cat.id], categoryNames: [cat.name], majorCategory: cat.major_category ?? "기타" });
    }
  }
  return tabs;
}

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

type GradeTab = "전체" | "프로전문가부" | "학생부";

export default function JudgeResultPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [tabs, setTabs] = useState<ResultTab[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedTabKey, setSelectedTabKey] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [pendingJudges, setPendingJudges] = useState<Judge[]>([]);
  const [submittedJudgeCount, setSubmittedJudgeCount] = useState(0);
  const [gradeTab, setGradeTab] = useState<GradeTab>("전체");
  const [previewFiles, setPreviewFiles] = useState<Record<string, ContestantFile[]>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string>("");
  const [videoFullscreen, setVideoFullscreen] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminJudges, setAdminJudges] = useState<AdminJudge[]>([]);

  const tabsRef = { current: tabs };
  tabsRef.current = tabs;
  const isAdminRef = useRef(false);

  useEffect(() => {
    api("/api/judge/competitions").then(setCompetitions).catch(() => { });
    fetch("/api/judge/me").then((r) => r.json()).then((d) => { isAdminRef.current = d.isAdmin ?? false; setIsAdmin(d.isAdmin ?? false); }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedCompetition) { setTabs([]); return; }
    api(`/api/judge/categories?competition_id=${selectedCompetition.id}&filter_empty=true`).then((data: Category[]) => {
      setTabs(buildResultTabs(data));
    }).catch(() => { });
    setSelectedTabKey(null);
    setResults([]);
    setPreviewFiles({});
    setPreview(null);
  }, [selectedCompetition]);

  const currentTab = tabs.find((t) => t.key === selectedTabKey) ?? null;

  const loadTab = useCallback(async (tab: ResultTab) => {
    setLoading(true);
    setResults([]);
    setPreviewFiles({});
    setPreview(null);
    try {
      const [allData, contestantArrays] = await Promise.all([
        Promise.all(tab.categoryIds.map((catId) => api(`/api/judge/results?category_id=${catId}`))),
        Promise.all(tab.categoryIds.map((catId) => api(`/api/judge/contestants?category_id=${catId}`))),
      ]);

      const combined: ResultRow[] = [];
      let sharedCriteria: Criterion[] = [];
      const mergedJudges: Judge[] = [];
      const mergedPending: Judge[] = [];
      let firstAwards: Award[] = [];
      let maxSubmitted = 0;
      const filesMap: Record<string, ContestantFile[]> = {};

      for (let i = 0; i < tab.categoryIds.length; i++) {
        const data = allData[i];
        const catName = tab.categoryNames[i];
        for (const r of data.results) combined.push({ ...r, _categoryName: catName });
        if (i === 0) { sharedCriteria = data.criteria; firstAwards = data.awards; }
        for (const j of data.judges ?? []) { if (!mergedJudges.find((x) => x.id === j.id)) mergedJudges.push(j); }
        for (const j of data.pending_judges ?? []) { if (!mergedPending.find((x) => x.id === j.id)) mergedPending.push(j); }
        maxSubmitted = Math.max(maxSubmitted, data.submitted_judge_count);
        for (const c of contestantArrays[i]) {
          if (c.contestant_files?.length) filesMap[c.id] = c.contestant_files;
        }
      }

      // 종목 순서 유지, 각 종목 내 번호 순
      combined.sort((a, b) => {
        const ai = tab.categoryNames.indexOf(a._categoryName ?? "");
        const bi = tab.categoryNames.indexOf(b._categoryName ?? "");
        if (ai !== bi) return ai - bi;
        return (a.number ?? 0) - (b.number ?? 0);
      });

      setResults(combined);
      setCriteria(sharedCriteria);
      setAwards(firstAwards);
      setJudges(mergedJudges);
      setPendingJudges(mergedPending);
      setSubmittedJudgeCount(maxSubmitted);
      setPreviewFiles(filesMap);
      setGradeTab("전체");

      // isAdminRef 체크 없이 항상 시도 — API가 직접 권한 검사 (race condition 방지)
      try {
        const adminData = await api(`/api/judge/admin/submissions?category_ids=${tab.categoryIds.join(",")}`);
        setAdminJudges(adminData);
      } catch { setAdminJudges([]); }
    } catch (e: unknown) { setMsg((e as Error).message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTabKey) {
      const tab = tabs.find((t) => t.key === selectedTabKey);
      if (tab) loadTab(tab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTabKey]);

  // isAdmin이 늦게 resolve 된 경우 (race condition) adminJudges 재로드
  useEffect(() => {
    if (!isAdmin || !selectedTabKey) return;
    const tab = tabs.find((t) => t.key === selectedTabKey);
    if (!tab) return;
    api(`/api/judge/admin/submissions?category_ids=${tab.categoryIds.join(",")}`)
      .then(setAdminJudges)
      .catch(() => setAdminJudges([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(""), 4000); return () => clearTimeout(t); } }, [msg]);

  const handleReject = useCallback(async (judgeId: string, categoryId: string, judgeName: string, categoryName?: string) => {
    const label = categoryName ? `${judgeName} (${categoryName})` : judgeName;
    if (!confirm(`${label}의 채점 제출을 반려하시겠습니까?\n반려 후 심사위원이 다시 제출할 수 있습니다.`)) return;
    try {
      const res = await fetch("/api/judge/scores/submit", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ judge_id: judgeId, category_id: categoryId }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg(`${label}의 제출이 반려되었습니다.`);
      const tab = tabsRef.current.find((t) => t.key === selectedTabKey);
      if (tab) loadTab(tab);
    } catch (e: unknown) { setMsg((e as Error).message); }
  }, [selectedTabKey, loadTab]);

  // 등수 필터링 + 전체 기준 글로벌 등수 계산
  const globalRankMap: { [id: string]: number } = {};
  const sortedByTotal = [...results].filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  sortedByTotal.forEach((r) => {
    if (!(r.id in globalRankMap)) {
      globalRankMap[r.id] = sortedByTotal.findIndex((x) => x.total === r.total) + 1;
    }
  });

  const displayResults = (() => {
    if (gradeTab === "전체") return results;
    const filtered = results.filter((r) => r.grade === gradeTab);
    // 필터링 후 등수 재산출
    const sortedF = [...filtered].filter((r) => r.total !== null).sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    const rankF: { [id: string]: number } = {};
    sortedF.forEach((r) => { if (!(r.id in rankF)) rankF[r.id] = sortedF.findIndex((x) => x.total === r.total) + 1; });
    return filtered.map((r) => ({ ...r, _gradeRank: rankF[r.id] }));
  })() as (ResultRow & { _gradeRank?: number })[];

  const hasGrades = results.some((r) => r.grade);
  const isMultiCat = (currentTab?.categoryIds.length ?? 0) > 1;
  const maxTotal = criteria.reduce((s, cr) => s + cr.max_score, 0);
  const hasPhotos = Object.values(previewFiles).some((files) => files.some((f) => f.file_type.startsWith("image")));
  const hasVideos = Object.values(previewFiles).some((files) => files.some((f) => f.file_type === "youtube" || f.file_type.startsWith("video")));
  const activePhotoUrl = preview?.kind === "photo" ? preview.url : null;

  // 탭 그룹 (대종목별)
  const tabGroups = new Map<string, ResultTab[]>();
  for (const tab of tabs) {
    const major = tab.majorCategory;
    if (!tabGroups.has(major)) tabGroups.set(major, []);
    tabGroups.get(major)!.push(tab);
  }
  const isMultiGroup = tabGroups.size > 1;

  const colCount = 1 + (hasPhotos ? 1 : 0) + (hasVideos ? 1 : 0) + (hasGrades && gradeTab === "전체" ? 1 : 0) + criteria.length + 2;

  const exportCSV = () => {
    if (!displayResults.length) return;
    const header = ["순위", "번호", "부문", ...criteria.map((c) => `${c.name}(${c.max_score}점)`), "총점", "시상"];
    const rows = displayResults.map((r) => {
      const rank = gradeTab === "전체" ? (globalRankMap[r.id] ?? "-") : (r._gradeRank ?? "-");
      return [rank, r.number ?? "-", r.grade ?? "", ...r.criteria_scores.map((cs) => cs.avg !== null ? cs.avg.toFixed(2) : "-"), r.total !== null ? r.total.toFixed(2) : "-", r.award ?? ""];
    });
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `결과_${currentTab?.displayName ?? ""}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* 원본 사진 풀스크린 */}
      {fullscreenUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setFullscreenUrl("")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fullscreenUrl} alt="원본" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setFullscreenUrl("")} className="absolute top-4 right-6 text-white text-3xl leading-none hover:opacity-70">✕</button>
        </div>
      )}

      {/* 영상 풀스크린 */}
      {videoFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setVideoFullscreen(null)}>
          <div className="w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setVideoFullscreen(null)} className="absolute top-4 right-6 text-white text-3xl leading-none hover:opacity-70">✕</button>
            {videoFullscreen.kind === "youtube" && (
              <div className="relative" style={{ paddingBottom: "56.25%" }}>
                <iframe src={`https://www.youtube.com/embed/${videoFullscreen.id}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="absolute inset-0 w-full h-full rounded-xl" title="영상" />
              </div>
            )}
            {videoFullscreen.kind === "video" && (
              <video src={videoFullscreen.url} controls autoPlay className="w-full rounded-xl bg-black"><track kind="captions" /></video>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 채점 결과</h1>
            <p className="text-sm text-gray-500 mt-0.5">심사위원 점수 합산 · 자동 등수 산출</p>
          </div>
          <a href="/judge/admin" className="text-sm text-blue-600 hover:underline">← 관리 패널</a>
        </div>

        {msg && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">{msg}</div>}

        {/* 대회 선택 */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <select
            value={selectedCompetition?.id ?? ""}
            onChange={(e) => { const c = competitions.find((x) => x.id === e.target.value) ?? null; setSelectedCompetition(c); }}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">대회 선택</option>
            {competitions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          {selectedTabKey && (
            <button onClick={() => { const tab = tabs.find(t => t.key === selectedTabKey); if (tab) loadTab(tab); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">새로고침</button>
          )}
          {displayResults.length > 0 && (
            <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">CSV 내보내기</button>
          )}
        </div>

        {/* 종목 탭 — 채점 페이지와 동일한 구조 */}
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
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentTab && !loading && results.length > 0 && (
          <>
            {/* 심사위원 + 시상 정보 */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 whitespace-nowrap">✅ 제출완료</span>
                {judges.length > 0 ? judges.map((j) => {
                  const aj = isAdmin ? adminJudges.find((x) => x.id === j.id) : null;
                  const submittedCats = aj ? aj.categories.filter((c) => currentTab?.categoryIds.includes(c.categoryId) && c.submitted) : [];
                  return (
                    <div key={j.id} className="inline-flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-full px-3 py-0.5">{j.name}</span>
                      {isAdmin && submittedCats.map((c) => {
                        const catName = currentTab && currentTab.categoryIds.length > 1
                          ? currentTab.categoryNames[currentTab.categoryIds.indexOf(c.categoryId)]
                          : undefined;
                        return (
                          <button key={c.categoryId}
                            onClick={() => handleReject(j.id, c.categoryId, j.name, catName)}
                            className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded hover:bg-red-100 transition">
                            반려{catName ? ` (${catName})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  );
                }) : <span className="text-sm text-gray-400">{submittedJudgeCount > 0 ? `${submittedJudgeCount}명` : "없음"}</span>}
              </div>
              {pendingJudges.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5 whitespace-nowrap">⏳ 미제출</span>
                  {pendingJudges.map((j) => (
                    <span key={j.id} className="text-sm text-red-500 bg-white border border-red-200 rounded-full px-3 py-0.5">{j.name}</span>
                  ))}
                </div>
              )}
              {awards.length > 0 && !isMultiCat && (
                <div className="flex gap-1.5 flex-wrap">
                  {awards.map((a) => <span key={a.id} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${awardBadgeClass(a.award_name)}`}>{a.award_name} {a.count}명</span>)}
                </div>
              )}
            </div>

            {/* 부문별 탭 */}
            {hasGrades && (
              <div className="flex gap-2 mb-4">
                {(["전체", "프로전문가부", "학생부"] as GradeTab[]).map((tab) => (
                  <button key={tab} onClick={() => setGradeTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${gradeTab === tab ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:border-blue-300"}`}>
                    {tab === "전체" ? "전체통합순위" : tab}
                    {tab !== "전체" && (
                      <span className="ml-1 text-xs opacity-75">({results.filter((r) => r.grade === tab).length}명)</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {loading && <div className="text-center py-12 text-gray-400">집계 중...</div>}

        {!loading && displayResults.length > 0 && (
          <div className="flex gap-4 items-start">

            {/* 왼쪽: 사진 / 영상 패널 */}
            {preview && (
              <div className="sticky top-20 shrink-0 w-80 xl:w-96">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">{preview.kind === "photo" ? "작품 사진" : "영상"}</span>
                    <div className="flex items-center gap-2">
                      {preview.kind !== "photo" && (
                        <button onClick={() => setVideoFullscreen(preview)}
                          className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-50 transition">
                          🔲 크게
                        </button>
                      )}
                      <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
                    </div>
                  </div>
                  {preview.kind === "photo" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview.url} alt="작품사진"
                      className="w-full object-contain max-h-[70vh] cursor-zoom-in"
                      onClick={() => setFullscreenUrl(preview.url)} />
                  )}
                  {preview.kind === "youtube" && (
                    <div className="relative" style={{ paddingBottom: "56.25%" }}>
                      <iframe src={`https://www.youtube.com/embed/${preview.id}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen className="absolute inset-0 w-full h-full" title="영상" />
                    </div>
                  )}
                  {preview.kind === "video" && (
                    <video src={preview.url} controls autoPlay className="w-full bg-black"><track kind="captions" /></video>
                  )}
                </div>
              </div>
            )}

            {/* 오른쪽: 결과 테이블 */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400">{selectedCompetition?.title}</p>
                <h2 className="text-base font-semibold text-gray-800">{currentTab?.displayName}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap w-12">등수</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap w-14">번호</th>
                      {hasPhotos && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">작품사진</th>}
                      {hasVideos && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">영상</th>}
                      {hasGrades && gradeTab === "전체" && (
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">부문</th>
                      )}
                      {criteria.map((c) => (
                        <th key={c.id} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">
                          {c.name}<div className="text-gray-400 font-normal">/{c.max_score}</div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">총점{maxTotal > 0 ? `/${maxTotal}` : ""}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">시상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayResults.flatMap((r, idx) => {
                      const isFirstInGroup = isMultiCat && (idx === 0 || r._categoryName !== displayResults[idx - 1]._categoryName);
                      const rank = gradeTab === "전체" ? (globalRankMap[r.id] ?? null) : (r._gradeRank ?? null);
                      const files = previewFiles[r.id] ?? [];

                      const separatorRow = isFirstInGroup ? (
                        <tr key={`sep_${r._categoryName}_${idx}`} className="bg-purple-50/40">
                          <td colSpan={colCount} className="px-4 py-1.5 border-b border-purple-100">
                            <span className="text-xs font-semibold text-purple-500 border-l-2 border-purple-400 pl-2">{r._categoryName}</span>
                          </td>
                        </tr>
                      ) : null;

                      const mainRow = (
                        <tr key={r.id} className={`border-b border-gray-100 hover:bg-blue-50/20 transition ${r.award ? "bg-yellow-50/20" : ""}`}>
                          <td className="px-3 py-3 text-center">
                            {rank ? (
                              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold
                                ${rank === 1 ? "bg-yellow-400 text-yellow-900" : rank === 2 ? "bg-slate-400 text-white" : rank === 3 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                                {rank}등
                              </span>
                            ) : <span className="text-gray-300 text-xs">-</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold">{r.number}</span>
                          </td>
                          {hasPhotos && (
                            <td className="px-3 py-3 text-center">
                              <PhotoCell files={files} onSelect={(url) => setPreview(url ? { kind: "photo", url } : null)} activeUrl={activePhotoUrl} />
                            </td>
                          )}
                          {hasVideos && (
                            <td className="px-3 py-3 text-center">
                              <VideoCell files={files} onSelect={setPreview} />
                            </td>
                          )}
                          {hasGrades && gradeTab === "전체" && (
                            <td className="px-3 py-3 text-center">
                              {r.grade ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${
                                  r.grade === "프로전문가부" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"
                                }`}>{r.grade}</span>
                              ) : <span className="text-gray-300">-</span>}
                            </td>
                          )}
                          {r.criteria_scores.map((cs) => (
                            <td key={cs.criterion_id} className="px-3 py-3 text-center">
                              {cs.avg !== null ? (
                                <span className="font-semibold text-blue-600">{cs.avg.toFixed(1)}</span>
                              ) : <span className="text-gray-300">-</span>}
                              {cs.judge_count > 0 && <span className="text-gray-300 text-xs block">({cs.judge_count}명)</span>}
                            </td>
                          ))}
                          <td className="px-3 py-3 text-center">
                            {r.total !== null ? (
                              <span className="text-xl font-bold text-gray-900">{r.total.toFixed(1)}</span>
                            ) : <span className="text-gray-300 text-xs">미집계</span>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {r.award ? <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${awardBadgeClass(r.award)}`}>{r.award}</span> : <span className="text-gray-300">-</span>}
                          </td>
                        </tr>
                      );

                      return separatorRow ? [separatorRow, mainRow] : [mainRow];
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && selectedTabKey && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">아직 집계할 채점 데이터가 없습니다.</div>
        )}
        {!selectedCompetition && (
          <div className="text-center py-12 text-gray-400">대회를 선택해주세요.</div>
        )}
        {selectedCompetition && !selectedTabKey && (
          <div className="text-center py-12 text-gray-400">종목을 선택하면 결과가 표시됩니다.</div>
        )}
      </div>
    </div>
  );
}

