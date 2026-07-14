"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

interface Category { id: string; name: string; major_category?: string; competition_id: string; }
interface Competition { id: string; title: string; }
interface ContestantFile { id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
interface Contestant { id: string; name: string; phone?: string; company?: string; grade?: string; number?: number; contestant_files?: ContestantFile[]; }
interface Criterion { id: string; name: string; max_score: number; display_order: number; }
type ScoreMap = { [contestantId: string]: { [criterionId: string]: { score: string; comment: string } } };

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

function VideoCell({ files }: { files: ContestantFile[] }) {
  const [open, setOpen] = useState(false);
  const ytFiles = files.filter((f) => f.file_type === "youtube" && f.video_url);
  const videoFiles = files.filter((f) => f.file_type.startsWith("video") && f.storage_path);
  if (ytFiles.length === 0 && videoFiles.length === 0) return <span className="text-gray-300 text-xs">-</span>;

  const ytId = ytFiles[0] ? getYouTubeId(ytFiles[0].video_url!) : null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition">
        ▶ 재생
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {ytId ? (
              <div className="relative" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-lg"
                  title="영상"
                />
              </div>
            ) : videoFiles[0] ? (
              <video
                src={`${SUPABASE_URL}/storage/v1/object/public/contestant-files/${videoFiles[0].storage_path}`}
                controls autoPlay className="w-full rounded-lg bg-black"
              >
                <track kind="captions" />
              </video>
            ) : null}
            <button onClick={() => setOpen(false)} className="mt-3 block mx-auto text-white/70 text-sm hover:text-white">✕ 닫기</button>
          </div>
        </div>
      )}
    </>
  );
}


export default function JudgeScorePage() {
  const [assignments, setAssignments] = useState<{ id: string; category: Category & { competitions: Competition } }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [submitted, setSubmitted] = useState<{ [categoryId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string>("");
  const saveTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const scoresRef = useRef<ScoreMap>({});
  const criteriaRef = useRef<Criterion[]>([]);
  const selectedCategoryIdRef = useRef<string | null>(null);

  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { criteriaRef.current = criteria; }, [criteria]);
  useEffect(() => { selectedCategoryIdRef.current = selectedCategoryId; }, [selectedCategoryId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/judge/my-assignments");
        if (!res.ok) { window.location.href = "/judge"; return; }
        const data = await res.json();
        setAssignments(data.assignments);
        if (data.assignments.length > 0) setSelectedCategoryId(data.assignments[0].category.id);
        setSubmitted(data.submitted);
      } catch { window.location.href = "/judge"; }
      setLoading(false);
    })();
  }, []);

  const loadCategory = useCallback(async (categoryId: string) => {
    setCatLoading(true);
    try {
      const [cs, crs, scs] = await Promise.all([
        api(`/api/judge/contestants?category_id=${categoryId}`),
        api(`/api/judge/criteria?category_id=${categoryId}`),
        api(`/api/judge/scores?category_id=${categoryId}`),
      ]);
      setContestants(cs);
      setCriteria(crs);
      const map: ScoreMap = {};
      for (const s of scs) {
        if (!map[s.contestant_id]) map[s.contestant_id] = {};
        map[s.contestant_id][s.criterion_id] = { score: String(s.score), comment: s.comment ?? "" };
      }
      setScores(map);
    } catch (e: unknown) { setMsg((e as Error).message); }
    setCatLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      setPreviewPhoto("");
      loadCategory(selectedCategoryId);
    }
  }, [selectedCategoryId, loadCategory]);

  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(""), 4000); return () => clearTimeout(t); }
  }, [msg]);

  const handleChange = (contestantId: string, criterionId: string, value: string) => {
    setScores((prev) => ({
      ...prev,
      [contestantId]: {
        ...prev[contestantId],
        [criterionId]: { ...(prev[contestantId]?.[criterionId] ?? { score: "", comment: "" }), score: value },
      },
    }));
  };

  const handleSave = useCallback(async (contestantId: string, criterionId: string) => {
    const key = `${contestantId}_${criterionId}`;
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const categoryId = selectedCategoryIdRef.current;
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
    if (!selectedCategoryId) return;
    if (!confirm("채점을 제출하면 이후 수정이 불가능합니다. 제출하시겠습니까?")) return;
    setSubmitting(true);
    try {
      await api("/api/judge/scores/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: selectedCategoryId }) });
      setSubmitted((prev) => ({ ...prev, [selectedCategoryId]: true }));
      setMsg("채점이 제출되었습니다.");
    } catch (e: unknown) { setMsg((e as Error).message); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">로딩 중...</div>;

  const selectedAssignment = assignments.find((a) => a.category.id === selectedCategoryId);
  const isSubmitted = selectedCategoryId ? !!submitted[selectedCategoryId] : false;

  // 종목별 파일 존재 여부
  const hasPhotos = contestants.some((c) =>
    (c.contestant_files ?? []).some((f) => f.file_type.startsWith("image") && f.storage_path)
  );
  const hasVideos = contestants.some((c) =>
    (c.contestant_files ?? []).some((f) =>
      (f.file_type === "youtube" && f.video_url) || (f.file_type.startsWith("video") && f.storage_path)
    )
  );

  // 등수 계산 (총점 기준 내림차순)
  const maxTotal = criteria.reduce((s, cr) => s + cr.max_score, 0);
  const totals = contestants.map((c) => ({
    id: c.id,
    total: criteria.reduce((sum, cr) => {
      const v = parseFloat(scores[c.id]?.[cr.id]?.score ?? "");
      return sum + (isNaN(v) ? 0 : v);
    }, 0),
  }));
  const sorted = [...totals].sort((a, b) => b.total - a.total);
  const rankMap: { [id: string]: number } = {};
  sorted.forEach((item, i) => {
    if (item.total > 0) {
      const sameScore = sorted.filter((x) => x.total === item.total);
      rankMap[item.id] = sorted.findIndex((x) => x.total === item.total) + 1;
      if (sameScore.length > 1) { /* 동점 처리: 같은 등수 */ }
    }
  });

  const totalFilled = criteria.length > 0
    ? contestants.filter((c) => criteria.every((cr) => {
        const v = scores[c.id]?.[cr.id]?.score;
        return v !== undefined && v !== "";
      })).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚖️ 심사 채점</h1>

        {msg && (
          <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{msg}</div>
        )}

        {/* 종목 탭 — 대종목별 그룹 */}
        {assignments.length > 0 && (() => {
          const groups = new Map<string, typeof assignments>();
          for (const a of assignments) {
            const major = a.category.major_category ?? "기타";
            if (!groups.has(major)) groups.set(major, []);
            groups.get(major)!.push(a);
          }
          const isMultiGroup = groups.size > 1;
          return (
            <div className={`mb-6 ${isMultiGroup ? "space-y-2" : ""}`}>
              {[...groups.entries()].map(([major, items]) => (
                <div key={major} className={isMultiGroup ? "flex items-start gap-2 flex-wrap" : "flex gap-2 flex-wrap"}>
                  {isMultiGroup && (
                    <span className="shrink-0 text-xs font-bold text-white bg-purple-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                      {major}
                    </span>
                  )}
                  {items.map((a) => (
                    <button
                      key={a.category.id}
                      onClick={() => setSelectedCategoryId(a.category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                        selectedCategoryId === a.category.id
                          ? "bg-blue-600 text-white shadow"
                          : "bg-white border text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {a.category.name}
                      {submitted[a.category.id] && <span className="ml-1.5 text-xs opacity-75">✓</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}

        {selectedAssignment && (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{selectedAssignment.category.competitions.title}</p>
              <h2 className="text-lg font-semibold text-gray-800">{selectedAssignment.category.name}</h2>
            </div>
            {isSubmitted && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">✅ 제출완료</span>
            )}
          </div>
        )}

        {catLoading ? (
          <div className="text-center py-16 text-gray-400">로딩 중...</div>
        ) : contestants.length === 0 ? (
          <div className="text-center py-16 text-gray-400">등록된 선수가 없습니다.</div>
        ) : (
          <div className={`flex gap-4 items-start`}>

            {/* 왼쪽: 사진 확대 패널 */}
            {previewPhoto && (
              <div className="sticky top-20 shrink-0 w-80 xl:w-96">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">작품 사진</span>
                    <button onClick={() => setPreviewPhoto("")} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewPhoto} alt="작품사진" className="w-full object-contain max-h-[70vh]" />
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
                          {cr.name}
                          <div className="text-gray-400 font-normal">/{cr.max_score}</div>
                        </th>
                      ))}
                      {criteria.length === 0 && (
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">채점</th>
                      )}
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">
                        총점{maxTotal > 0 ? `/${maxTotal}` : ""}
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">등수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contestants.map((c) => {
                      const rank = rankMap[c.id];
                      const cTotal = totals.find((t) => t.id === c.id)!.total;
                      return (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50/20 transition">
                          {/* 번호 */}
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold">
                              {c.number}
                            </span>
                          </td>

                          {/* 작품사진 */}
                          {hasPhotos && (
                            <td className="px-3 py-3">
                              <PhotoCell files={c.contestant_files ?? []} onSelect={setPreviewPhoto} activeUrl={previewPhoto} />
                            </td>
                          )}

                          {/* 영상 */}
                          {hasVideos && (
                            <td className="px-3 py-3 text-center">
                              <VideoCell files={c.contestant_files ?? []} />
                            </td>
                          )}

                          {/* 채점 항목들 */}
                          {criteria.length > 0 ? criteria.map((cr) => {
                            const val = scores[c.id]?.[cr.id]?.score ?? "";
                            const num = parseFloat(val);
                            const valid = !isNaN(num) && num >= 0 && num <= cr.max_score;
                            return (
                              <td key={cr.id} className="px-2 py-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={cr.max_score}
                                  value={val}
                                  disabled={isSubmitted}
                                  onChange={(e) => handleChange(c.id, cr.id, e.target.value)}
                                  onBlur={() => valid && handleSave(c.id, cr.id)}
                                  className={`w-16 text-center border rounded-lg px-1 py-1.5 text-sm font-medium
                                    ${isSubmitted ? "bg-gray-50 text-gray-400 border-gray-200"
                                      : valid && val !== "" ? "border-blue-400 bg-blue-50 text-blue-800"
                                      : val !== "" && !valid ? "border-red-400 bg-red-50"
                                      : "border-gray-300 focus:border-blue-400 focus:outline-none"}`}
                                  placeholder={`/${cr.max_score}`}
                                />
                              </td>
                            );
                          }) : (
                            <td className="px-3 py-3 text-center text-xs text-gray-400">채점항목<br/>미설정</td>
                          )}

                          {/* 총점 */}
                          <td className="px-3 py-3 text-center">
                            {criteria.length > 0 ? (
                              <div className={`text-xl font-bold ${cTotal > 0 ? "text-blue-700" : "text-gray-300"}`}>
                                {cTotal}
                              </div>
                            ) : <span className="text-gray-300">-</span>}
                          </td>

                          {/* 등수 */}
                          <td className="px-3 py-3 text-center">
                            {rank ? (
                              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold
                                ${rank === 1 ? "bg-yellow-400 text-yellow-900"
                                  : rank === 2 ? "bg-gray-300 text-gray-800"
                                  : rank === 3 ? "bg-amber-600 text-white"
                                  : "bg-gray-100 text-gray-600"}`}>
                                {rank}등
                              </span>
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 하단 제출 */}
              {!isSubmitted && criteria.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    채점 완료: <strong className="text-blue-600">{totalFilled} / {contestants.length}명</strong>
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || totalFilled < contestants.length}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? "제출 중..." : "채점 제출"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
