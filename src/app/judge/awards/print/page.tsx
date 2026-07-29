"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface ContestantResult {
  id: string;
  name: string;
  grade: string | null;
  company: string | null;
  number: number | null;
  category_name: string;
  major_category: string | null;
  normalized_score: number | null;
  award: string | null;
  manual_award: string | null;
}

interface CompanyGroup {
  company: string;
  pro: ContestantResult[];
  student: ContestantResult[];
  other: ContestantResult[];
  awarded_count: number;
}

interface CompAward {
  id: string;
  grade: string | null;
  award_name: string;
  display_order: number;
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

interface Competition {
  id: string;
  title: string;
  date_display: string | null;
}

const AWARD_ORDER: Record<string, number> = {
  "월드MVP챔피언": 0,
  "월드마스터": 1,
  "월드그랑프리": 2,
  "그랑프리": 3,
  "대상": 4,
  "금상": 5,
  "은상": 6,
  "동상": 7,
  "장려상": 8,
};

type PrintTab = "단체별" | "시상별" | "전체목록";

export default function AwardsPrintPage() {
  const params = useSearchParams();
  const compId = params.get("competition_id");
  const filterCompany = params.get("company"); // 특정 단체만 출력

  const [comp, setComp] = useState<Competition | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PrintTab>("단체별");
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!compId) return;
    setLoading(true);
    try {
      const [comps, res] = await Promise.all([
        fetch("/api/judge/competitions").then(r => r.json()),
        fetch(`/api/judge/competition-results?competition_id=${compId}`).then(r => r.json()),
      ]);
      const found = (comps as Competition[]).find(c => c.id === compId);
      setComp(found ?? null);
      setResults(res as ResultsData);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [compId]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => window.print();

  if (!compId) return <div className="p-8 text-gray-500">competition_id 파라미터가 필요합니다.</div>;
  if (loading) return <div className="p-8 text-gray-400 text-center">불러오는 중...</div>;
  if (!results) return <div className="p-8 text-red-500">데이터를 불러올 수 없습니다.</div>;

  const allContestants = [...results.pro_results, ...results.student_results];
  const displayGroups = filterCompany
    ? results.by_company.filter(g => g.company === filterCompany)
    : results.by_company;
  const allAwardNames = [...new Map(
    [...results.pro_awards, ...results.student_awards].map(a => [a.award_name, a])
  ).values()].sort((a, b) => (AWARD_ORDER[a.award_name] ?? 99) - (AWARD_ORDER[b.award_name] ?? 99));

  // 단체별 special award 계산
  const personCatMap = new Map<string, { grade: string | null; cats: Set<string> }>();
  for (const r of allContestants) {
    const k = `${r.name}|${r.company ?? ""}|${r.grade ?? ""}`;
    if (!personCatMap.has(k)) personCatMap.set(k, { grade: r.grade, cats: new Set() });
    personCatMap.get(k)!.cats.add(r.category_name);
  }
  const specialMap = new Map<string, "최우수선수상" | "우수선수상">();
  for (const [k, p] of personCatMap) {
    if (p.cats.size >= 3)
      specialMap.set(k, p.grade === "프로전문가부" ? "최우수선수상" : "우수선수상");
  }

  return (
    <>
      <style>{`
        .company-name-cell { background: #e0e0e0; font-weight: bold; text-align: left; padding: 4px 8px; font-size: 10pt; }
        @media print {
          .no-print { display: none !important; }
          header, footer { display: none !important; }
          body { margin: 0; padding: 0; font-size: 9pt; color: #000; }
          .print-page { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
          .company-break { page-break-before: always; break-before: page; }
          .award-block { page-break-inside: avoid; break-inside: avoid; margin-bottom: 6mm; }
          table { border-collapse: collapse; width: 100%; }
          thead { display: table-header-group; }
          th, td { border: 0.5px solid #ccc; padding: 2px 4px; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .company-name-cell { background: #e0e0e0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .award-badge { border: 0.5px solid #999; border-radius: 3px; padding: 1px 4px; font-size: 8pt; }
          h1 { font-size: 14pt; margin-bottom: 2mm; }
          h2 { font-size: 10pt; margin: 0 0 2mm; }
          h3 { font-size: 9pt; margin: 0 0 1mm; }
        }
        @page { size: A4; margin: 12mm 10mm; }
      `}</style>

      {/* 화면 컨트롤 영역 */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => window.history.back()}
          className="text-gray-500 hover:text-gray-700 text-sm">← 돌아가기</button>
        <span className="text-gray-300">|</span>
        {(["단체별", "시상별", "전체목록"] as PrintTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{t}</button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-gray-400">A4 세로 기준</span>
        <button onClick={handlePrint}
          className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center gap-1.5">
          🖨️ 인쇄 / PDF 저장
        </button>
      </div>

      {/* 인쇄 본문 */}
      <div ref={printRef} className="print-page max-w-4xl mx-auto" style={{ padding: "24px 32px" }}>

        {/* 헤더 */}
        <div className="mb-6 border-b-2 border-gray-800 pb-3">
          <h1 className="text-2xl font-bold text-gray-900">{comp?.title ?? "대회"}</h1>
          {comp?.date_display && <p className="text-sm text-gray-500 mt-0.5">{comp.date_display}</p>}
          {filterCompany ? (
            <p className="text-sm text-blue-700 font-medium mt-1">📋 {filterCompany} 시상 결과</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              시상 결과 — 프로 {results.total_pro}명 / 학생 {results.total_student}명
            </p>
          )}
        </div>

        {/* 시상 범례 */}
        <div className="no-print mb-4 flex flex-wrap gap-2">
          {allAwardNames.map(a => (
            <span key={a.id}
              className="text-xs px-2 py-0.5 rounded-full border border-gray-300 bg-gray-50 text-gray-700">
              {a.award_name}
            </span>
          ))}
        </div>

        {/* ────── 단체별 ────── */}
        {tab === "단체별" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4 no-print">
              {filterCompany ? `${filterCompany} 시상 결과` : "단체별 시상 결과"}
            </h2>
            {displayGroups.map((group, gi) => {
              const all = [...group.pro, ...group.student, ...group.other]
                .sort((a, b) => a.name.localeCompare(b.name, "ko"));
              if (all.length === 0) return null;

              // 사람별 그룹
              type PG = { name: string; grade: string | null; rows: ContestantResult[]; specialAward?: string };
              const pgMap = new Map<string, PG>();
              const pgOrder: string[] = [];
              for (const r of all) {
                const k = `${r.name}|${r.company ?? ""}|${r.grade ?? ""}`;
                if (!pgMap.has(k)) {
                  pgMap.set(k, { name: r.name, grade: r.grade, rows: [], specialAward: specialMap.get(k) });
                  pgOrder.push(k);
                }
                pgMap.get(k)!.rows.push(r);
              }
              const pgs = pgOrder.map(k => pgMap.get(k)!);

              return (
                <div key={group.company} className={gi > 0 ? "company-break" : ""} style={{ marginBottom: "6mm" }}>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th colSpan={6} className="company-name-cell border border-gray-400">
                          {group.company}
                          <span style={{ marginLeft: "12px", fontWeight: "normal", fontSize: "0.8em", color: "#666" }}>
                            {all.length}명 참가 · 수상 {group.awarded_count}명
                          </span>
                        </th>
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-center w-10">번호</th>
                        <th className="border border-gray-300 px-2 py-1 text-left w-20">이름</th>
                        <th className="border border-gray-300 px-2 py-1 text-center w-12">부문</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">종목</th>
                        <th className="border border-gray-300 px-2 py-1 text-center w-20">시상</th>
                        <th className="border border-gray-300 px-2 py-1 text-center w-20">특별상</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pgs.flatMap((pg, pi) =>
                        pg.rows.map((r, ri) => (
                          <tr key={r.id} className={pi % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">{r.number ?? "-"}</td>
                            <td className="border border-gray-200 px-2 py-1 font-semibold">{ri === 0 ? pg.name : ""}</td>
                            <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                              {ri === 0 ? (pg.grade === "프로전문가부" ? "프로" : pg.grade === "학생부" ? "학생" : "") : ""}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-gray-700">{r.category_name}</td>
                            <td className="border border-gray-200 px-2 py-1 text-center">
                              {r.award ? (
                                <span className="award-badge font-semibold">{r.award}</span>
                              ) : <span className="text-gray-300">-</span>}
                            </td>
                            <td className="border border-gray-200 px-2 py-1 text-center">
                              {ri === 0 ? (
                                pg.specialAward
                                  ? <span className="award-badge font-semibold">{pg.specialAward}</span>
                                  : <span className="text-gray-300">-</span>
                              ) : ""}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* ────── 시상별 ────── */}
        {tab === "시상별" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4 no-print">시상별 수상자 목록</h2>
            {allAwardNames.map(awardDef => {
              const winners = allContestants.filter(r => r.award === awardDef.award_name);
              if (winners.length === 0) return null;
              return (
                <div key={awardDef.id} className="award-block mb-5">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-400 pb-1 mb-2 flex items-center gap-2">
                    <span>{awardDef.award_name}</span>
                    <span className="text-xs font-normal text-gray-500">{winners.length}명</span>
                    <span className="text-xs font-normal text-gray-400">
                      ({awardDef.grade === "프로전문가부" ? "프로전문가부" : "학생부"})
                    </span>
                  </h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-center w-10">번호</th>
                        <th className="border border-gray-300 px-2 py-1 text-left w-24">이름</th>
                        <th className="border border-gray-300 px-2 py-1 text-left w-28">단체</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">종목</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.sort((a, b) => a.name.localeCompare(b.name, "ko")).map((r, i) => (
                        <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">{r.number ?? "-"}</td>
                          <td className="border border-gray-200 px-2 py-1 font-semibold">{r.name}</td>
                          <td className="border border-gray-200 px-2 py-1 text-gray-600">{r.company ?? "-"}</td>
                          <td className="border border-gray-200 px-2 py-1 text-gray-700">{r.category_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* ────── 전체목록 ────── */}
        {tab === "전체목록" && (
          <div>
            <h2 className="text-base font-bold text-gray-700 mb-4 no-print">전체 수상자 목록</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-center w-10">번호</th>
                  <th className="border border-gray-300 px-2 py-1 text-left w-20">이름</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-12">부문</th>
                  <th className="border border-gray-300 px-2 py-1 text-left w-28">단체</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">종목</th>
                  <th className="border border-gray-300 px-2 py-1 text-center w-20">시상</th>
                </tr>
              </thead>
              <tbody>
                {allContestants
                  .filter(r => r.award)
                  .sort((a, b) => {
                    const ao = AWARD_ORDER[a.award!] ?? 99;
                    const bo = AWARD_ORDER[b.award!] ?? 99;
                    if (ao !== bo) return ao - bo;
                    return a.name.localeCompare(b.name, "ko");
                  })
                  .map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-200 px-2 py-1 text-center text-gray-500">{r.number ?? "-"}</td>
                      <td className="border border-gray-200 px-2 py-1 font-semibold">{r.name}</td>
                      <td className="border border-gray-200 px-2 py-1 text-center text-gray-600">
                        {r.grade === "프로전문가부" ? "프로" : r.grade === "학생부" ? "학생" : ""}
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-gray-600">{r.company ?? "-"}</td>
                      <td className="border border-gray-200 px-2 py-1 text-gray-700">{r.category_name}</td>
                      <td className="border border-gray-200 px-2 py-1 text-center font-semibold">
                        <span className="award-badge">{r.award}</span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* 인쇄 푸터 */}
        <div className="mt-8 pt-3 border-t border-gray-300 text-xs text-gray-400 text-right">
          {comp?.title} 시상 결과 · alltica.co.kr
        </div>
      </div>
    </>
  );
}
