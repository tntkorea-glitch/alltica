"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SCALE_LABELS, getScaleForCriterion } from "@/lib/judge-criteria-data";

interface Category { id: string; name: string; competition_id: string; }
interface Competition { id: string; title: string; }
interface Contestant { id: string; name: string; phone?: string; company?: string; grade?: string; number?: number; contestant_files?: ContestantFile[]; }
interface ContestantFile { id: string; storage_path: string | null; file_name: string; file_type: string; video_url?: string | null; }
interface Criterion { id: string; name: string; max_score: number; display_order: number; }
interface ScoreMap { [contestantId: string]: { [criterionId: string]: { score: string; comment: string } } }
interface SubmittedSet { [categoryId: string]: boolean }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? res.statusText); }
  return res.json();
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function FileViewer({ file }: { file: ContestantFile }) {
  // YouTube 임베드
  if (file.file_type === "youtube" && file.video_url) {
    const videoId = getYouTubeId(file.video_url);
    if (videoId) {
      return (
        <div className="border rounded-lg overflow-hidden bg-black">
          <div className="relative" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              title={file.file_name}
            />
          </div>
        </div>
      );
    }
    return (
      <a href={file.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 text-sm text-red-600 hover:underline border rounded-lg">
        ▶ YouTube 영상 보기
      </a>
    );
  }

  const url = `${SUPABASE_URL}/storage/v1/object/public/contestant-files/${file.storage_path}`;
  const isVideo = file.file_type.startsWith("video");
  const isImage = file.file_type.startsWith("image");

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      {isImage && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={file.file_name} className="w-full max-h-64 object-contain bg-black" />
        </a>
      )}
      {isVideo && (
        <video src={url} controls className="w-full max-h-64 bg-black">
          <track kind="captions" />
        </video>
      )}
      {!isImage && !isVideo && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 text-sm text-blue-600 hover:underline">
          📎 {file.file_name}
        </a>
      )}
    </div>
  );
}

function ScoreCard({
  contestant, criteria, scores, submitted, categoryId, categoryName,
  onChange, onSave,
}: {
  contestant: Contestant;
  criteria: Criterion[];
  scores: ScoreMap;
  submitted: boolean;
  categoryId: string;
  categoryName: string;
  onChange: (contestantId: string, criterionId: string, field: "score" | "comment", value: string) => void;
  onSave: (contestantId: string, criterionId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const totalMax = criteria.reduce((s, c) => s + c.max_score, 0);
  const totalScore = criteria.reduce((s, c) => {
    const v = parseFloat(scores[contestant.id]?.[c.id]?.score ?? "");
    return s + (isNaN(v) ? 0 : v);
  }, 0);
  const allFilled = criteria.every((c) => {
    const v = scores[contestant.id]?.[c.id]?.score;
    return v !== undefined && v !== "";
  });
  const filledCount = criteria.filter((c) => {
    const v = scores[contestant.id]?.[c.id]?.score;
    return v !== undefined && v !== "";
  }).length;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${allFilled ? "border-green-300" : ""}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          {contestant.number && <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{contestant.number}</span>}
          <div>
            <span className="font-semibold text-gray-900">{contestant.name}</span>
            {contestant.company && <span className="text-xs text-gray-400 ml-2">{contestant.company}</span>}
          </div>
          {allFilled
            ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">채점완료</span>
            : filledCount > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{filledCount}/{criteria.length}</span>
          }
        </div>
        <div className="flex items-center gap-4">
          {allFilled && <span className="text-sm font-bold text-blue-600">{totalScore} / {totalMax}점</span>}
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t px-5 py-4 space-y-5">
          {/* 파일 뷰어 */}
          {(contestant.contestant_files ?? []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(contestant.contestant_files ?? []).map((f) => (
                <FileViewer key={f.id} file={f} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-lg">등록된 작품 파일이 없습니다.</p>
          )}

          {/* 채점 항목 */}
          <div className="space-y-4">
            {criteria.map((c) => {
              const val = scores[contestant.id]?.[c.id] ?? { score: "", comment: "" };
              const scoreNum = parseFloat(val.score);
              const valid = !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= c.max_score;
              // 대면/출품 모두 시도해서 scale 찾기
              const scaleVals =
                getScaleForCriterion(categoryName, c.name, "출품") ??
                getScaleForCriterion(categoryName, c.name, "대면");

              const selectScore = (v: number) => {
                if (submitted) return;
                onChange(contestant.id, c.id, "score", String(v));
                setTimeout(() => onSave(contestant.id, c.id), 50);
              };

              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">
                      {c.name}
                      <span className="text-gray-400 font-normal ml-1">/ {c.max_score}점</span>
                    </label>
                    {val.score !== "" && (
                      <span className={`text-sm font-bold ${valid ? "text-blue-600" : "text-red-500"}`}>
                        {valid ? `${val.score}점` : `범위 초과 (0~${c.max_score})`}
                      </span>
                    )}
                  </div>

                  {scaleVals ? (
                    /* 5단계 버튼 */
                    <div className="grid grid-cols-5 gap-1.5">
                      {scaleVals.map((v, i) => {
                        const selected = val.score === String(v);
                        return (
                          <button
                            key={i}
                            onClick={() => selectScore(v)}
                            disabled={submitted}
                            className={`flex flex-col items-center py-2 px-1 rounded-lg border text-center transition text-xs leading-tight
                              ${selected
                                ? "bg-blue-600 border-blue-600 text-white font-bold"
                                : submitted
                                  ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50"
                              }`}
                          >
                            <span className="font-bold text-sm">{v}</span>
                            <span className={`mt-0.5 ${selected ? "text-blue-100" : "text-gray-400"}`} style={{ fontSize: "0.65rem" }}>{SCALE_LABELS[i]}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* fallback: 숫자 입력 */
                    <input
                      type="number"
                      min={0}
                      max={c.max_score}
                      value={val.score}
                      disabled={submitted}
                      onChange={(e) => onChange(contestant.id, c.id, "score", e.target.value)}
                      onBlur={() => valid && onSave(contestant.id, c.id)}
                      className={`w-32 border rounded-lg px-3 py-2 text-sm ${submitted ? "bg-gray-50 text-gray-400" : "focus:border-blue-400 focus:outline-none"}`}
                      placeholder={`0 ~ ${c.max_score}`}
                    />
                  )}

                  <input
                    type="text"
                    value={val.comment}
                    disabled={submitted}
                    onChange={(e) => onChange(contestant.id, c.id, "comment", e.target.value)}
                    onBlur={() => onSave(contestant.id, c.id)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${submitted ? "bg-gray-50 text-gray-400" : "focus:border-blue-400 focus:outline-none"}`}
                    placeholder="코멘트 (선택)"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JudgeScorePage() {
  const [assignments, setAssignments] = useState<{ id: string; category: Category & { competitions: Competition } }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<ScoreMap>({});
  const [submitted, setSubmitted] = useState<SubmittedSet>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const saveTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const scoresRef = useRef<ScoreMap>({});
  const criteriaRef = useRef<Criterion[]>([]);
  const selectedCategoryIdRef = useRef<string | null>(null);

  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { criteriaRef.current = criteria; }, [criteria]);
  useEffect(() => { selectedCategoryIdRef.current = selectedCategoryId; }, [selectedCategoryId]);

  // 내 배정 목록 로드
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

  // 종목 선택 시 선수·항목·점수 로드
  const loadCategory = useCallback(async (categoryId: string) => {
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
  }, []);

  useEffect(() => {
    if (selectedCategoryId) loadCategory(selectedCategoryId);
  }, [selectedCategoryId, loadCategory]);

  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(""), 4000); return () => clearTimeout(t); }
  }, [msg]);

  const handleChange = (contestantId: string, criterionId: string, field: "score" | "comment", value: string) => {
    setScores((prev) => ({
      ...prev,
      [contestantId]: { ...prev[contestantId], [criterionId]: { ...(prev[contestantId]?.[criterionId] ?? { score: "", comment: "" }), [field]: value } },
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
        await api("/api/judge/scores", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contestant_id: contestantId, criterion_id: criterionId, score: scoreNum, comment: val.comment, category_id: categoryId }) });
      } catch (e: unknown) { setMsg((e as Error).message); }
    }, 600);
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
  const totalFilled = contestants.filter((c) => criteria.every((cr) => scores[c.id]?.[cr.id]?.score !== "" && scores[c.id]?.[cr.id]?.score !== undefined)).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⚖️ 심사 채점</h1>

        {msg && <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">{msg}</div>}

        {/* 종목 탭 */}
        {assignments.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {assignments.map((a) => (
              <button key={a.category.id} onClick={() => setSelectedCategoryId(a.category.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${selectedCategoryId === a.category.id ? "bg-blue-600 text-white" : "bg-white border text-gray-700 hover:border-blue-300"}`}>
                {a.category.name}
                {submitted[a.category.id] && <span className="ml-1.5 text-xs opacity-75">✓</span>}
              </button>
            ))}
          </div>
        )}

        {selectedAssignment && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{selectedAssignment.category.competitions.title}</h2>
            <p className="text-sm text-gray-500">종목: {selectedAssignment.category.name}</p>
          </div>
        )}

        {isSubmitted && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
            ✅ 이 종목의 채점이 제출 완료되었습니다. 수정이 불가능합니다.
          </div>
        )}

        <div className="space-y-3 mb-6">
          {contestants.map((c) => (
            <ScoreCard
              key={c.id}
              contestant={c}
              criteria={criteria}
              scores={scores}
              submitted={isSubmitted}
              categoryId={selectedCategoryId ?? ""}
              categoryName={selectedAssignment?.category.name ?? ""}
              onChange={handleChange}
              onSave={handleSave}
            />
          ))}
          {contestants.length === 0 && <p className="text-sm text-gray-400 text-center py-8">등록된 선수가 없습니다.</p>}
        </div>

        {!isSubmitted && contestants.length > 0 && (
          <div className="sticky bottom-4">
            <div className="bg-white border rounded-2xl shadow-lg px-6 py-4 flex items-center justify-between">
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
          </div>
        )}
      </div>
    </div>
  );
}
