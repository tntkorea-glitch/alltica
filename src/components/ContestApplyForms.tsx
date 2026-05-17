"use client";

import { useState, FormEvent, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Contest } from "@/lib/contests";
import { formatPhone } from "@/lib/phone";

type ApplyType = "athlete" | "judge" | "committee";

const TYPE_TABS: { type: ApplyType; label: string; icon: string; desc: string }[] = [
  { type: "athlete", label: "선수 신청", icon: "🏅", desc: "선수로 참가" },
  { type: "judge", label: "심사위원 신청", icon: "⚖️", desc: "심사위원으로 활동" },
  { type: "committee", label: "조직위 신청", icon: "📋", desc: "운영진으로 참여" },
];

const TYPE_TITLE: Record<ApplyType, string> = {
  athlete: "선수신청",
  judge: "심사위원신청",
  committee: "조직위신청",
};

const CAREER_OPTIONS = ["1년 미만", "1–3년", "3–5년", "5–10년", "10년 이상"];
const COMMITTEE_ROLES = ["현장진행", "심판보조", "접수/안내", "홍보/마케팅", "촬영/기록", "기타"];
const QUALIFICATION_OPTIONS = [
  "미용대회 수상경력 2회 이상",
  "미용업종 경력 2년 이상",
  "미용학과/관련학과 졸업자 및 학위 보유자",
  "기타",
];

const ATHLETE_GRADES = ["학생부", "프로전문가부"] as const;
type AthleteGrade = typeof ATHLETE_GRADES[number];

const IBC_EVENT_CATEGORIES = [
  { category: "SMP", items: ["SMP"] },
  {
    category: "PMU (반영구)",
    items: ["아이라인", "헤어라인", "엠보기본", "엠보응용", "그라데이션(머신/수지/콤보)", "립아트", "풀조화아트"],
  },
  {
    category: "네일",
    items: [
      "젤 매니큐어(선마블)", "젤 매니큐어(부채꼴마블)", "젤 원톤 스캅춰",
      "아크릴 프렌치 스캅춰", "실크 익스텐션", "팁 위드 랩",
      "페디아트", "스톤아트", "창작아트", "살롱매니아트",
    ],
  },
  { category: "속눈썹연장", items: ["클래식연장", "볼륨연장"] },
  { category: "LED속눈썹연장", items: ["LED 클래식연장", "LED 볼륨연장"] },
  { category: "속눈썹펌", items: ["속눈썹펌", "언더펌"] },
  { category: "슈가링왁싱", items: ["슈가링 페이스", "슈가링 바디"] },
  { category: "왁싱", items: ["왁싱 페이스", "왁싱 바디"] },
  {
    category: "피부",
    items: [
      "페이스관리", "살롱테크닉(특수관리)", "살롱테크닉(밤부테라피)",
      "바디관리(등)", "바디관리(복부)", "바디관리(다리)", "바디관리(팔)",
    ],
  },
  { category: "타투", items: ["레터링", "미니타투"] },
  { category: "플라즈마", items: ["플라즈마"] },
  { category: "플래닝", items: ["스킨플래닝", "패디플래닝"] },
  {
    category: "헤어(미용)",
    items: [
      "원랭스(이사도라)", "원랭스(스파니엘)", "원랭스(그래듀에이션)", "원랭스(레이어드)",
      "블로드라이", "롤세팅", "펌와인딩(9등분)", "펌와인딩(혼합형)",
      "살롱헤어커트", "업스타일", "고전머리", "불임머리",
    ],
  },
  {
    category: "헤어(이용)",
    items: ["단발형 이발(하상고)", "단발형 이발(중상고)", "짧은 단발형 이발(둥근형)", "아이롱"],
  },
  {
    category: "메이크업",
    items: [
      "뷰티메이크업", "시대별메이크업", "캐릭터메이크업", "패션메이크업", "웨딩메이크업",
      "환타지메이크업", "특수분장", "바디페인팅", "아트마스크", "뷰티일러스트레이션",
    ],
  },
];

const IBC_COMMITTEE_CATEGORIES = [
  "대회본부 직책 희망 (종목직책 이외) — 대회 종목별 대면 심사에는 직접 심사 참여하지 않는 직책",
  "PMU (반영구)",
  "SMP (선수인원 미충족시 PMU(반영구) 심사로 통합 진행)",
  "네일",
  "메이크업",
  "속눈썹연장",
  "LED속눈썹연장 (선수인원 미충족시 속눈썹 심사로 통합 진행)",
  "속눈썹펌 (선수인원 미충족시 속눈썹 심사로 통합 진행)",
  "왁싱",
  "슈가링왁싱 (선수인원 미충족시 왁싱 심사로 통합 진행)",
  "피부",
  "플라즈마 (선수인원 미충족시 피부 심사로 통합 진행)",
  "플래닝 (스킨플래닝) — 선수인원 미충족시 플래닝 혹은 피부 심사로 통합 진행",
  "플래닝 (패디플래닝) — 선수인원 미충족시 플래닝 혹은 피부 심사로 통합 진행",
  "헤어 (미용)",
  "헤어 (이용)",
];

const CONTEST_EVENT_MAP: Record<string, typeof IBC_EVENT_CATEGORIES> = {
  "contest-ibc-12th-2026-07": IBC_EVENT_CATEGORIES,
};

function buildEventCategories(contestId: string, tags: string[]) {
  if (CONTEST_EVENT_MAP[contestId]) return CONTEST_EVENT_MAP[contestId];
  // 범용 폴백: 태그 기반 단순 목록
  return [{ category: "신청 종목", items: tags }];
}

function calcAthleteFee(grade: string, count: number): string {
  if (!grade || count === 0) return "";
  if (grade === "학생부") {
    if (count === 1) return "40,000원";
    if (count === 2) return "70,000원";
    if (count === 3) return "100,000원";
    return `${100000 + (count - 3) * 30000}원`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (count === 1) return "100,000원";
  if (count === 2) return "180,000원";
  if (count === 3) return "260,000원";
  return `${260000 + (count - 3) * 80000}원`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const DAUM_POSTCODE_SRC =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

interface DaumPostcodeData {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName?: string;
  userSelectedType?: "R" | "J";
}
interface DaumPostcodeWindow extends Window {
  daum?: {
    Postcode: new (opts: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void };
  };
}
function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as DaumPostcodeWindow;
    if (w.daum?.Postcode) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${DAUM_POSTCODE_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = DAUM_POSTCODE_SRC; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load failed"));
    document.body.appendChild(s);
  });
}

// ── 공통 UI 컴포넌트 ────────────────────────────────────────────────

function SectionHeader({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
      <span className="text-lg">{icon}</span>
      <div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function TextField({
  label, value, onChange, required, error, placeholder, type = "text", className = "", hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; error?: string; placeholder?: string; type?: string; className?: string; hint?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SelectField({
  label, value, onChange, options, required, error, placeholder, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; required?: boolean; error?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm bg-white`}
      >
        <option value="">{placeholder || "선택해주세요"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function CheckboxGroup({
  label, options, selected, onChange, required, error,
}: {
  label: string; options: string[]; selected: string[];
  onChange: (v: string[]) => void; required?: boolean; error?: string;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  }
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selected.includes(opt)
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function EventCategorySelector({
  categories, selected, onChange, error,
}: {
  categories: { category: string; items: string[] }[];
  selected: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const [openCat, setOpenCat] = useState<string | null>(null);

  function toggleItem(item: string) {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(({ category, items }) => {
          const selCount = items.filter(i => selected.includes(i)).length;
          const isSingle = items.length === 1;
          const isActive = selCount > 0;
          const isOpen = openCat === category;

          return (
            <div key={category} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isSingle) toggleItem(items[0]);
                  else setOpenCat(isOpen && !isActive ? null : category);
                }}
                className={`py-3 px-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-between ${
                  isActive
                    ? "border-brand bg-brand text-white"
                    : isOpen
                    ? "border-brand/40 bg-brand/5 text-brand"
                    : "border-gray-200 bg-white text-gray-600 hover:border-brand/30"
                }`}
              >
                <span className="truncate">{category}</span>
                {isActive ? (
                  <span className="ml-1 shrink-0 text-xs bg-white/25 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{selCount}</span>
                ) : !isSingle ? (
                  <svg className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : null}
              </button>
              {!isSingle && (isOpen || selCount > 0) && (
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-2 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide">세부종목 선택</p>
                  {items.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.includes(item)}
                        onChange={() => toggleItem(item)}
                        className="w-4 h-4 accent-brand shrink-0"
                      />
                      <span className={`text-sm ${selected.includes(item) ? "text-brand font-semibold" : "text-gray-600"}`}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-3 bg-brand/5 border border-brand/15 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-brand mb-1.5">선택된 종목 ({selected.length}종목)</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map(item => (
              <span key={item} className="inline-flex items-center gap-1 text-xs bg-white border border-brand/30 text-brand px-2.5 py-0.5 rounded-full font-medium">
                {item}
                <button type="button" onClick={() => toggleItem(item)} className="text-brand/50 hover:text-red-500 transition-colors leading-none ml-0.5">×</button>
              </span>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function AthleteFeeDisplay({ grade, count }: { grade: string; count: number }) {
  if (!grade || count === 0) return null;
  const fee = calcAthleteFee(grade, count);
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-emerald-800">{grade} · {count}종목</p>
        {count >= 3 && (
          <p className="text-xs text-amber-600 font-semibold">🏆 3종목 이상 특별상(추가수여) 대상</p>
        )}
        <p className="text-[11px] text-emerald-600">입금: 기업은행 010-9293-5659 · 뷰티스트총연합회(KBA)</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xl font-extrabold text-emerald-700">{fee}</p>
        <p className="text-[10px] text-emerald-500">신청비</p>
      </div>
    </div>
  );
}

function TextareaField({
  label, value, onChange, required, error, placeholder, rows = 4, hint, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; error?: string; placeholder?: string; rows?: number; hint?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm resize-y`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit" disabled={submitting}
      className="w-full bg-brand text-white py-4 rounded-xl font-bold text-base hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand/20"
    >
      {submitting ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          신청 접수 중...
        </span>
      ) : label}
    </button>
  );
}

// ── 문서 OCR 업로드 컴포넌트 ────────────────────────────────────────────────

type OcrState = "idle" | "running" | "done" | "error";

interface OcrFields {
  name?: string; company?: string; position?: string;
  phone?: string; email?: string; address?: string;
}

interface DocumentUploadProps {
  onOcrResult: (fields: OcrFields, postal: string, address: string) => void;
  onFileChange: (file: File | null) => void;
}

function DocumentUpload({ onOcrResult, onFileChange }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    onFileChange(f);
    setOcrState("running");
    setOcrError(null);

    try {
      const fd = new FormData();
      fd.append("image", f);
      const res = await fetch("/api/ocr/business-card", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "OCR 요청 실패" }));
        throw new Error(error);
      }
      const { fields } = await res.json() as { fields: OcrFields };
      let postal = "";
      let addr: string = fields.address || "";
      if (addr) {
        const m = addr.match(/^[\s(\[]*([0-9]{5,6})[\s)\]\-:]+(.+)$/);
        if (m) { postal = m[1]; addr = m[2].trim(); }
      }
      onOcrResult(fields, postal, addr);
      setOcrState("done");
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "OCR 처리 실패");
      setOcrState("error");
    }
  }

  function remove() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setOcrState("idle");
    setOcrError(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {!file ? (
        <div className="relative rounded-xl border-2 border-dashed border-gray-200 p-5 text-center hover:border-brand/40 transition-colors bg-gray-50/50">
          <input
            ref={inputRef} type="file" accept="image/*,.pdf"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-3xl mb-2">📎</div>
          <p className="text-sm font-semibold text-gray-600">명함 또는 사업자등록증 업로드</p>
          <p className="text-xs text-gray-400 mt-1">이미지 첨부 시 기본 정보가 자동으로 입력됩니다</p>
          <p className="text-xs text-gray-300 mt-1">JPG · PNG · WebP · 최대 8MB</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 p-3 flex gap-3 items-center bg-white">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="미리보기" className="w-20 h-14 object-cover rounded-lg border border-gray-100 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs mt-0.5">
              {ocrState === "running" && (
                <span className="text-brand inline-flex items-center gap-1">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  정보 추출 중...
                </span>
              )}
              {ocrState === "done" && <span className="text-emerald-600 font-semibold">✓ 자동 입력 완료 · 내용을 확인해주세요</span>}
              {ocrState === "error" && <span className="text-red-500">{ocrError}</span>}
            </p>
          </div>
          <button type="button" onClick={remove} className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-red-50">
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

// ── 프로필 사진 업로드 컴포넌트 ────────────────────────────────────────────────

function ProfilePhotoUpload({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    onChange(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  function remove() {
    onChange(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="프로필" className="w-20 h-24 object-cover rounded-xl border border-gray-200" />
          <button
            type="button" onClick={remove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative w-20 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center hover:border-brand/40 transition-colors shrink-0">
          <input
            ref={inputRef} type="file" accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span className="text-2xl">🖼</span>
          <span className="text-[10px] text-gray-400 mt-0.5">사진 추가</span>
        </div>
      )}
      <div className="text-xs text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-700 mb-0.5">대회 책자 등록용 프로필 사진</p>
        <p>• 증명사진 또는 활동 사진 권장</p>
        <p>• 대회 책자 인쇄에 사용됩니다</p>
        <p className="text-gray-400">• 선택사항 (나중에 이메일로 제출 가능)</p>
        {file && (
          <p className="text-emerald-600 font-semibold mt-1">✓ {file.name}</p>
        )}
      </div>
    </div>
  );
}

// ── 주소 입력 컴포넌트 ────────────────────────────────────────────────

function AddressFields({
  postalCode, address, addressDetail,
  onPostalChange, onAddressChange, onDetailChange,
}: {
  postalCode: string; address: string; addressDetail: string;
  onPostalChange: (v: string) => void; onAddressChange: (v: string) => void; onDetailChange: (v: string) => void;
}) {
  async function openPostcode() {
    try {
      await loadDaumPostcode();
      const w = window as DaumPostcodeWindow;
      if (!w.daum?.Postcode) return;
      new w.daum.Postcode({
        oncomplete: (data) => {
          const base = data.userSelectedType === "R"
            ? data.roadAddress || data.address
            : data.jibunAddress || data.address;
          const full = data.buildingName ? `${base} (${data.buildingName})` : base;
          onPostalChange(data.zonecode);
          onAddressChange(full);
        },
      }).open();
    } catch {
      alert("우편번호 검색을 불러오지 못했습니다.");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">주소</label>
      <div className="flex gap-2">
        <input
          type="text" value={postalCode} readOnly placeholder="우편번호"
          className="w-28 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400"
        />
        <button
          type="button" onClick={openPostcode}
          className="px-4 py-2.5 rounded-xl border border-brand/30 bg-brand/5 text-brand text-sm font-semibold hover:bg-brand/10 transition-colors"
        >
          우편번호 검색
        </button>
      </div>
      <input
        type="text" value={address} onChange={(e) => onAddressChange(e.target.value)}
        placeholder="기본 주소"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm"
      />
      <input
        type="text" value={addressDetail} onChange={(e) => onDetailChange(e.target.value)}
        placeholder="상세 주소 (예: 101동 1203호)"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm"
      />
    </div>
  );
}

// ── 배송지 주소 섹션 ────────────────────────────────────────────────

function ShippingAddressSection({
  notice, sameAddress, onSameAddressChange,
  postalCode, address, addressDetail,
  onPostalChange, onAddressChange, onDetailChange,
}: {
  notice: string;
  sameAddress: boolean; onSameAddressChange: (v: boolean) => void;
  postalCode: string; address: string; addressDetail: string;
  onPostalChange: (v: string) => void; onAddressChange: (v: string) => void; onDetailChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block text-sm font-semibold text-gray-700">배송지 주소</label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox" checked={sameAddress}
            onChange={(e) => onSameAddressChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-brand"
          />
          <span className="text-sm text-gray-600">상동 (위와 동일한 주소)</span>
        </label>
      </div>
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <span className="text-base">📦</span>
        <p className="text-xs text-amber-700 leading-relaxed">{notice}</p>
      </div>
      {!sameAddress && (
        <AddressFields
          postalCode={postalCode} address={address} addressDetail={addressDetail}
          onPostalChange={onPostalChange}
          onAddressChange={onAddressChange}
          onDetailChange={onDetailChange}
        />
      )}
    </div>
  );
}

// ── 심사위원 신청 폼 ────────────────────────────────────────────────

interface JudgeState {
  nameKo: string; nameEn: string; company: string; birthdate: string;
  phone: string; email: string;
  postalCode: string; address: string; addressDetail: string;
  shippingPostalCode: string; shippingAddress: string; shippingAddressDetail: string;
  sameShippingAddress: boolean;
  sns: string; position: string;
  specialties: string[];
  qualificationItems: string[];
  qualificationOtherText: string;
  qualificationNotes: string;
  bannerApply: boolean | null;
  bannerHorizontalApply: boolean | null;
  bannerHorizontalText: string;
  agreePrivacy: boolean;
}

const emptyJudge: JudgeState = {
  nameKo: "", nameEn: "", company: "", birthdate: "",
  phone: "", email: "",
  postalCode: "", address: "", addressDetail: "",
  shippingPostalCode: "", shippingAddress: "", shippingAddressDetail: "",
  sameShippingAddress: false,
  sns: "", position: "",
  specialties: [],
  qualificationItems: [],
  qualificationOtherText: "",
  qualificationNotes: "",
  bannerApply: null,
  bannerHorizontalApply: null,
  bannerHorizontalText: "",
  agreePrivacy: false,
};

type JudgeErrors = Partial<Record<keyof JudgeState, string>>;

function JudgeForm({
  contest,
  onSubmit,
}: {
  contest: Contest;
  onSubmit: (data: Record<string, unknown>, files: Record<string, File>) => Promise<void>;
}) {
  const [form, setForm] = useState<JudgeState>(emptyJudge);
  const [errors, setErrors] = useState<JudgeErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  function set<K extends keyof JudgeState>(key: K, val: JudgeState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function handleOcrResult(fields: { name?: string; company?: string; position?: string; phone?: string; email?: string }, postal: string, addr: string) {
    setForm((p) => ({
      ...p,
      nameKo: fields.name || p.nameKo,
      company: fields.company || p.company,
      position: fields.position || p.position,
      phone: fields.phone ? formatPhone(fields.phone) : p.phone,
      email: fields.email || p.email,
      postalCode: postal || p.postalCode,
      address: addr || p.address,
    }));
  }

  function validate(): boolean {
    const next: JudgeErrors = {};
    if (!form.nameKo.trim()) next.nameKo = "한글 이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (!form.email.trim()) next.email = "이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (!form.agreePrivacy) next.agreePrivacy = "개인정보 수집에 동의해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const fullAddress = [
      form.postalCode ? `(${form.postalCode})` : "",
      form.address, form.addressDetail,
    ].map((s) => s.trim()).filter(Boolean).join(" ");

    const shippingFullAddress = form.sameShippingAddress
      ? fullAddress
      : [
          form.shippingPostalCode ? `(${form.shippingPostalCode})` : "",
          form.shippingAddress, form.shippingAddressDetail,
        ].map((s) => s.trim()).filter(Boolean).join(" ");

    const data: Record<string, unknown> = {
      한글이름: form.nameKo,
      영문이름: form.nameEn,
      상호업체명: form.company,
      생년월일: form.birthdate,
      연락처: form.phone,
      이메일: form.email,
      주소: fullAddress,
      배송지주소: shippingFullAddress,
      SNS아이디: form.sns,
      직책: form.position,
      심사종목: form.specialties,
      자격요건: form.qualificationItems.map((item) =>
        item === "기타" && form.qualificationOtherText
          ? `기타: ${form.qualificationOtherText}`
          : item
      ),
      경력사항: form.qualificationNotes,
      배너신청: form.bannerApply === null ? "미선택" : form.bannerApply ? "신청" : "미신청",
      현수막신청: form.bannerHorizontalApply === null ? "미선택" : form.bannerHorizontalApply ? "신청" : "미신청",
      현수막문구: form.bannerHorizontalApply ? form.bannerHorizontalText : "",
    };

    const files: Record<string, File> = {};
    if (docFile) files.document = docFile;
    if (profileFile) files.profilePhoto = profileFile;

    try {
      await onSubmit(data, files);
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ① 문서 업로드 (OCR) */}
      <section className="space-y-3">
        <SectionHeader
          icon="📎"
          title="명함 / 사업자등록증 첨부"
          sub="선택사항 · 업로드 시 아래 정보가 자동 입력됩니다"
        />
        <DocumentUpload
          onOcrResult={handleOcrResult}
          onFileChange={setDocFile}
        />
      </section>

      {/* ② 개인 정보 */}
      <section className="space-y-4">
        <SectionHeader icon="👤" title="개인 정보" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="한글 이름" value={form.nameKo} onChange={(v) => set("nameKo", v)}
            required error={errors.nameKo} placeholder="홍길동"
          />
          <TextField
            label="영문 이름" value={form.nameEn} onChange={(v) => set("nameEn", v)}
            placeholder="Hong Gil Dong"
          />
          <TextField
            label="상호 / 업체명 / 소속" value={form.company} onChange={(v) => set("company", v)}
            placeholder="업체명 또는 소속 기관" className="sm:col-span-2"
          />
          <TextField
            label="생년월일" value={form.birthdate} onChange={(v) => set("birthdate", v)}
            type="date" placeholder="1990-01-01"
          />
          <TextField
            label="연락처" value={form.phone} onChange={(v) => set("phone", formatPhone(v))}
            required error={errors.phone} placeholder="010-0000-0000" type="tel"
          />
          <TextField
            label="이메일" value={form.email} onChange={(v) => set("email", v)}
            required error={errors.email} placeholder="example@email.com" type="email"
            className="sm:col-span-2"
          />
        </div>

        <AddressFields
          postalCode={form.postalCode} address={form.address} addressDetail={form.addressDetail}
          onPostalChange={(v) => set("postalCode", v)}
          onAddressChange={(v) => set("address", v)}
          onDetailChange={(v) => set("addressDetail", v)}
        />

        <ShippingAddressSection
          notice="위촉장 및 위촉패를 등록한 배송지 주소로 발송될 예정입니다."
          sameAddress={form.sameShippingAddress}
          onSameAddressChange={(v) => {
            set("sameShippingAddress", v);
            if (v) {
              set("shippingPostalCode", form.postalCode);
              set("shippingAddress", form.address);
              set("shippingAddressDetail", form.addressDetail);
            }
          }}
          postalCode={form.shippingPostalCode}
          address={form.shippingAddress}
          addressDetail={form.shippingAddressDetail}
          onPostalChange={(v) => set("shippingPostalCode", v)}
          onAddressChange={(v) => set("shippingAddress", v)}
          onDetailChange={(v) => set("shippingAddressDetail", v)}
        />

        <TextField
          label="인스타그램 / SNS 아이디" value={form.sns} onChange={(v) => set("sns", v)}
          placeholder="@instagram_id (선택)"
        />
      </section>

      {/* ③ 심사위원 정보 */}
      <section className="space-y-4">
        <SectionHeader icon="⚖️" title="심사위원 정보" />
        <TextField
          label="직책 / 직위" value={form.position} onChange={(v) => set("position", v)}
          placeholder="예: 원장, 강사, 교수 등"
        />
        <CheckboxGroup
          label="심사 가능 종목 (해당 종목 모두 선택)"
          options={contest.tags}
          selected={form.specialties}
          onChange={(v) => set("specialties", v)}
        />
        {/* 자격요건 체크박스 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">자격요건</label>
          <p className="text-xs text-gray-400 mb-3">※ 심사위원 기본 자격요건 (아래 중 1개 이상 해당, 복수 선택 가능)</p>
          <div className="space-y-2">
            {QUALIFICATION_OPTIONS.map((opt) => {
              const checked = form.qualificationItems.includes(opt);
              return (
                <div key={opt}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.qualificationItems, opt]
                          : form.qualificationItems.filter((o) => o !== opt);
                        set("qualificationItems", next);
                        if (!e.target.checked && opt === "기타") set("qualificationOtherText", "");
                      }}
                      className="w-4 h-4 rounded border-gray-300 accent-brand shrink-0"
                    />
                    <span className={`text-sm transition-colors ${checked ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                      {opt}
                    </span>
                  </label>
                  {opt === "기타" && checked && (
                    <input
                      type="text"
                      value={form.qualificationOtherText}
                      onChange={(e) => set("qualificationOtherText", e.target.value)}
                      placeholder="해당 자격요건을 직접 입력해주세요"
                      className="mt-1.5 ml-7 w-[calc(100%-1.75rem)] px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <TextareaField
          label="경력사항 / 수상경력"
          value={form.qualificationNotes}
          onChange={(v) => set("qualificationNotes", v)}
          placeholder="경력사항 / 자격사항 / 수상경력 등을 자유롭게 작성해주세요"
          rows={4}
        />
      </section>

      {/* ④ 배너 / 현수막 신청 */}
      <section className="space-y-4">
        <SectionHeader
          icon="🎌"
          title="배너 / 현수막 신청 (선택)"
          sub="신청수량한정 · 선착순마감 · 각 60,000원"
        />

        {/* 배너 신청 */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800">심사위원 X배너</span>
              <span className="ml-2 text-xs text-brand font-semibold">60,000원</span>
            </div>
            <span className="text-[10px] text-gray-400">신청수량한정 · 선착순</span>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="shrink-0 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/contests/mockup-banner.svg" alt="배너 시안" className="h-52 w-auto object-contain rounded-xl border border-gray-100 shadow-sm" />
              </div>
              <div className="flex-1 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">배너 제작 안내</p>
                <ul className="space-y-1 text-gray-500 leading-relaxed">
                  <li>• 위에 첨부한 프로필 사진으로 작업이 진행됩니다</li>
                  <li>• 다른 사진을 원하시면 이메일로 보내주세요</li>
                  <li className="text-brand font-medium">  kbabeautist@naver.com</li>
                  <li>• 대회 행사 후 개별적으로 가져가실 수 있습니다</li>
                  <li>• 신청 후 시안 작업 완료 시 개별 안내 드립니다</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                  <p className="text-amber-700 font-semibold text-[11px]">💳 입금 안내</p>
                  <p className="text-amber-600 text-[11px] mt-0.5">기업은행 · KBA뷰티스트총연합회</p>
                  <p className="text-amber-600 text-[11px]">010-9293-5659</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => set("bannerApply", val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.bannerApply === val
                      ? val
                        ? "border-brand bg-brand text-white"
                        : "border-gray-400 bg-gray-100 text-gray-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {val ? "✓ 신청합니다" : "신청안함"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 현수막 신청 */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800">현수막</span>
              <span className="ml-2 text-xs text-brand font-semibold">60,000원</span>
            </div>
            <span className="text-[10px] text-gray-400">신청수량한정 · 선착순</span>
          </div>
          <div className="p-4 space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/contests/mockup-horizontal.svg" alt="현수막 시안" className="w-full rounded-xl border border-gray-100 shadow-sm" />
            <p className="text-xs text-gray-500">상호명(업체명)만 넣으면 더 깔끔합니다. 신청 후 시안 작업 완료 시 개별 안내 드립니다.</p>
            <div className="flex gap-2">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => {
                    set("bannerHorizontalApply", val);
                    if (!val) set("bannerHorizontalText", "");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.bannerHorizontalApply === val
                      ? val
                        ? "border-brand bg-brand text-white"
                        : "border-gray-400 bg-gray-100 text-gray-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {val ? "✓ 신청합니다" : "신청안함"}
                </button>
              ))}
            </div>
            {form.bannerHorizontalApply === true && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  현수막 문구 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400">추천: 상호명만 입력하면 더 깔끔합니다 (예: ○○뷰티살롱, ○○아카데미)</p>
                <input
                  type="text"
                  value={form.bannerHorizontalText}
                  onChange={(e) => set("bannerHorizontalText", e.target.value)}
                  placeholder="현수막에 들어갈 문구를 입력하세요"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⑤ 대회 안내사항 (밴드 초대) */}
      <section className="space-y-3">
        <SectionHeader
          icon="📣"
          title="대회 안내사항"
          sub="밴드에서 대회 관련 공지를 받아보실 수 있습니다"
        />
        <a
          href="https://band.us/n/a6aebeQ093y3M"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-[#FFDF00]/10 border border-[#FFDF00]/30 rounded-2xl p-4 hover:bg-[#FFDF00]/20 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFDF00] flex items-center justify-center shrink-0 text-xl font-black text-black shadow-sm">
            b
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 group-hover:text-brand transition-colors">밴드 초대 참여하기</p>
            <p className="text-xs text-gray-500 mt-0.5">제 12회 IBC 국제뷰티스트챔피언쉽 IN 2026</p>
            <p className="text-xs text-brand mt-0.5 truncate">band.us/n/a6aebeQ093y3M</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </section>

      {/* ⑥ 프로필 사진 */}
      <section className="space-y-3">
        <SectionHeader
          icon="🖼"
          title="프로필 사진"
          sub="선택사항 · 대회 책자 및 배너 제작에 사용됩니다"
        />
        <ProfilePhotoUpload file={profileFile} onChange={setProfileFile} />
      </section>

      {/* ⑦ 개인정보 동의 */}
      <section>
        <div className={`rounded-xl border p-4 ${errors.agreePrivacy ? "border-red-300 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
          <div className="text-xs text-gray-600 mb-3 space-y-1">
            <div className="flex gap-8">
              <span className="text-gray-400 w-24 shrink-0">수집 항목</span>
              <span>이름, 연락처, 이메일, 주소</span>
            </div>
            <div className="flex gap-8">
              <span className="text-gray-400 w-24 shrink-0">수집 목적</span>
              <span>대회 진행 및 대회 안내</span>
            </div>
            <div className="flex gap-8">
              <span className="text-gray-400 w-24 shrink-0">보유 기간</span>
              <span>대회 종료 후 1년</span>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreePrivacy}
              onChange={(e) => set("agreePrivacy", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand accent-brand"
            />
            <span className="text-sm font-semibold text-gray-700">
              개인정보 수집 및 이용에 동의합니다<span className="text-red-500 ml-1">*</span>
            </span>
          </label>
          {errors.agreePrivacy && <p className="text-red-500 text-xs mt-2">{errors.agreePrivacy}</p>}
        </div>
      </section>

      <SubmitButton submitting={submitting} label="심사위원 신청 접수하기" />
    </form>
  );
}

// ── 선수 신청 폼 ────────────────────────────────────────────────

interface AthleteState {
  nameKo: string; nameEn: string; company: string; birthdate: string;
  phone: string; email: string;
  postalCode: string; address: string; addressDetail: string;
  shippingPostalCode: string; shippingAddress: string; shippingAddressDetail: string;
  sameShippingAddress: boolean;
  sns: string;
  grade: "" | AthleteGrade;
  divisions: string[];
  certificates: string; requests: string;
}

const emptyAthlete: AthleteState = {
  nameKo: "", nameEn: "", company: "", birthdate: "",
  phone: "", email: "",
  postalCode: "", address: "", addressDetail: "",
  shippingPostalCode: "", shippingAddress: "", shippingAddressDetail: "",
  sameShippingAddress: false,
  sns: "",
  grade: "",
  divisions: [],
  certificates: "", requests: "",
};

function AthleteForm({
  contest,
  onSubmit,
}: {
  contest: Contest;
  onSubmit: (data: Record<string, unknown>, files: Record<string, File>) => Promise<void>;
}) {
  const [form, setForm] = useState<AthleteState>(emptyAthlete);
  const [errors, setErrors] = useState<Partial<Record<keyof AthleteState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);

  function update<K extends keyof AthleteState>(key: K, val: AthleteState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function handleOcrResult(fields: { name?: string; company?: string; phone?: string; email?: string; address?: string }, postal: string, addr: string) {
    setForm((p) => ({
      ...p,
      nameKo: fields.name || p.nameKo,
      company: fields.company || p.company,
      phone: fields.phone ? formatPhone(fields.phone) : p.phone,
      email: fields.email || p.email,
      postalCode: postal || p.postalCode,
      address: addr || p.address,
    }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof AthleteState, string>> = {};
    if (!form.nameKo.trim()) next.nameKo = "한글 이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (!form.grade) next.grade = "접수 부문(학생부/프로전문가부)을 선택해주세요.";
    if (form.divisions.length === 0) next.divisions = "신청 종목을 하나 이상 선택해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const files: Record<string, File> = {};
    if (docFile) files.document = docFile;

    const fullAddress = [
      form.postalCode ? `(${form.postalCode})` : "",
      form.address, form.addressDetail,
    ].map((s) => s.trim()).filter(Boolean).join(" ");

    const shippingFullAddress = form.sameShippingAddress
      ? fullAddress
      : [
          form.shippingPostalCode ? `(${form.shippingPostalCode})` : "",
          form.shippingAddress, form.shippingAddressDetail,
        ].map((s) => s.trim()).filter(Boolean).join(" ");

    try {
      await onSubmit({ ...form, 주소: fullAddress, 배송지주소: shippingFullAddress }, files);
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <section className="space-y-3">
        <SectionHeader icon="📎" title="명함 / 사업자등록증 첨부" sub="선택사항 · 업로드 시 기본 정보가 자동 입력됩니다" />
        <DocumentUpload onOcrResult={handleOcrResult} onFileChange={setDocFile} />
      </section>

      <section className="space-y-4">
        <SectionHeader icon="👤" title="개인 정보" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="한글 이름" value={form.nameKo} onChange={(v) => update("nameKo", v)}
            required error={errors.nameKo} placeholder="홍길동"
          />
          <TextField
            label="영문 이름" value={form.nameEn} onChange={(v) => update("nameEn", v)}
            placeholder="Hong Gil Dong"
          />
          <TextField
            label="상호 / 업체명 / 소속" value={form.company} onChange={(v) => update("company", v)}
            placeholder="업체명 또는 소속 기관" className="sm:col-span-2"
          />
          <TextField
            label="생년월일" value={form.birthdate} onChange={(v) => update("birthdate", v)}
            type="date"
          />
          <TextField
            label="연락처" value={form.phone} onChange={(v) => update("phone", formatPhone(v))}
            required error={errors.phone} placeholder="010-0000-0000" type="tel"
          />
          <TextField
            label="이메일" value={form.email} onChange={(v) => update("email", v)}
            required error={errors.email} placeholder="example@email.com" type="email"
            className="sm:col-span-2"
          />
        </div>
        <AddressFields
          postalCode={form.postalCode} address={form.address} addressDetail={form.addressDetail}
          onPostalChange={(v) => update("postalCode", v)}
          onAddressChange={(v) => update("address", v)}
          onDetailChange={(v) => update("addressDetail", v)}
        />
        <ShippingAddressSection
          notice="결과 발표 후 상장 및 트로피(메달)를 등록한 배송지 주소로 발송될 예정입니다."
          sameAddress={form.sameShippingAddress}
          onSameAddressChange={(v) => {
            update("sameShippingAddress", v);
            if (v) {
              update("shippingPostalCode", form.postalCode);
              update("shippingAddress", form.address);
              update("shippingAddressDetail", form.addressDetail);
            }
          }}
          postalCode={form.shippingPostalCode}
          address={form.shippingAddress}
          addressDetail={form.shippingAddressDetail}
          onPostalChange={(v) => update("shippingPostalCode", v)}
          onAddressChange={(v) => update("shippingAddress", v)}
          onDetailChange={(v) => update("shippingAddressDetail", v)}
        />

        <TextField
          label="인스타그램 / SNS 아이디" value={form.sns} onChange={(v) => update("sns", v)}
          placeholder="@instagram_id (선택)"
        />
      </section>

      <section className="space-y-5">
        <SectionHeader icon="🏅" title="신청 정보" />

        {/* 접수 부문 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            접수 부문<span className="text-red-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ATHLETE_GRADES.map((g) => (
              <button
                key={g} type="button"
                onClick={() => update("grade", g)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                  form.grade === g
                    ? "border-brand bg-brand text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-brand/30"
                }`}
              >
                {g === "학생부" ? "🎓 학생부" : "💼 프로전문가부"}
                <p className="text-[10px] font-normal mt-0.5 opacity-70">
                  {g === "학생부" ? "중·고등부·대학부" : "현직 전문가"}
                </p>
              </button>
            ))}
          </div>
          {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
        </div>

        {/* 신청 종목 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            신청 종목<span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            대종목 클릭 → 세부종목 선택 · 복수 선택(2종목 이상) 가능
          </p>
          <EventCategorySelector
            categories={buildEventCategories(contest.id, contest.tags)}
            selected={form.divisions}
            onChange={(v) => update("divisions", v)}
            error={errors.divisions}
          />
        </div>

        {/* 신청 금액 안내 */}
        <AthleteFeeDisplay grade={form.grade} count={form.divisions.length} />

        {/* 금액 테이블 안내 */}
        {form.grade && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-gray-600 mb-1.5">참가비 안내 (작품 1점 기준)</p>
            <div className="grid grid-cols-5 gap-1 text-center">
              <div className="font-semibold text-gray-500">구분</div>
              <div className="font-semibold">1종목</div>
              <div className="font-semibold">2종목</div>
              <div className="font-semibold">3종목</div>
              <div className="font-semibold">4종목~</div>
              {(["학생부", "프로전문가부"] as const).map(g => {
                const fees = g === "학생부"
                  ? ["40,000", "70,000", "100,000", "+30,000"]
                  : ["100,000", "180,000", "260,000", "+80,000"];
                const active = form.grade === g;
                return (
                  <Fragment key={g}>
                    <div className={`text-left font-medium ${active ? "text-brand" : "text-gray-400"}`}>{g}</div>
                    {fees.map((fee, i) => (
                      <div key={i} className={`${active ? "text-gray-800 font-semibold" : "text-gray-300"} ${i === 3 ? "text-amber-600" : ""}`}>{fee}원</div>
                    ))}
                  </Fragment>
                );
              })}
            </div>
            <p className="text-gray-400 pt-1">3종목 이상 참가 시 특별상(추가수여) 대상 · 4종목부터 종목당 추가요금</p>
          </div>
        )}

        <TextareaField label="자격증 보유 현황" value={form.certificates} onChange={(v) => update("certificates", v)} placeholder="보유 자격증 (없으면 생략)" rows={3} />
        <TextareaField label="요청사항" value={form.requests} onChange={(v) => update("requests", v)} placeholder="기타 요청사항" rows={3} />
      </section>

      <SubmitButton submitting={submitting} label="선수 신청 접수하기" />
    </form>
  );
}

// ── 조직위 신청 폼 ────────────────────────────────────────────────

interface CommitteeState {
  nameKo: string; nameEn: string; company: string; birthdate: string;
  phone: string; email: string;
  postalCode: string; address: string; addressDetail: string;
  shippingPostalCode: string; shippingAddress: string; shippingAddressDetail: string;
  sameShippingAddress: boolean;
  sns: string; position: string[];
  desiredCategory: string;
  bannerApply: boolean | null;
  bannerHorizontalApply: boolean | null;
  bannerHorizontalText: string;
  agreePrivacy: boolean;
}

const KBA_POSITIONS = ["KBA이사진", "KBA지회장", "KBA지부장", "KBA정회원"] as const;

const emptyCommittee: CommitteeState = {
  nameKo: "", nameEn: "", company: "", birthdate: "",
  phone: "", email: "",
  postalCode: "", address: "", addressDetail: "",
  shippingPostalCode: "", shippingAddress: "", shippingAddressDetail: "",
  sameShippingAddress: false,
  sns: "", position: [],
  desiredCategory: "",
  bannerApply: null,
  bannerHorizontalApply: null,
  bannerHorizontalText: "",
  agreePrivacy: false,
};

type CommitteeErrors = Partial<Record<keyof CommitteeState, string>>;

function CommitteeForm({
  contest,
  onSubmit,
}: {
  contest: Contest;
  onSubmit: (data: Record<string, unknown>, files: Record<string, File>) => Promise<void>;
}) {
  const [form, setForm] = useState<CommitteeState>(emptyCommittee);
  const [errors, setErrors] = useState<CommitteeErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  function set<K extends keyof CommitteeState>(key: K, val: CommitteeState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function handleOcrResult(fields: { name?: string; company?: string; phone?: string; email?: string }, postal: string, addr: string) {
    setForm((p) => ({
      ...p,
      nameKo: fields.name || p.nameKo,
      company: fields.company || p.company,
      phone: fields.phone ? formatPhone(fields.phone) : p.phone,
      email: fields.email || p.email,
      postalCode: postal || p.postalCode,
      address: addr || p.address,
    }));
  }

  function validate(): boolean {
    const next: CommitteeErrors = {};
    if (!form.nameKo.trim()) next.nameKo = "한글 이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (!form.email.trim()) next.email = "이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (!form.desiredCategory) next.desiredCategory = "참가 희망 종목을 선택해주세요.";
    if (!form.agreePrivacy) next.agreePrivacy = "개인정보 수집에 동의해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const fullAddress = [
      form.postalCode ? `(${form.postalCode})` : "",
      form.address, form.addressDetail,
    ].map((s) => s.trim()).filter(Boolean).join(" ");

    const shippingFullAddress = form.sameShippingAddress
      ? fullAddress
      : [
          form.shippingPostalCode ? `(${form.shippingPostalCode})` : "",
          form.shippingAddress, form.shippingAddressDetail,
        ].map((s) => s.trim()).filter(Boolean).join(" ");

    const data: Record<string, unknown> = {
      한글이름: form.nameKo,
      영문이름: form.nameEn,
      상호업체명: form.company,
      생년월일: form.birthdate,
      연락처: form.phone,
      이메일: form.email,
      주소: fullAddress,
      배송지주소: shippingFullAddress,
      SNS아이디: form.sns,
      직책: form.position,
      참가희망종목: form.desiredCategory,
      배너신청: form.bannerApply === null ? "미선택" : form.bannerApply ? "신청" : "미신청",
      현수막신청: form.bannerHorizontalApply === null ? "미선택" : form.bannerHorizontalApply ? "신청" : "미신청",
      현수막문구: form.bannerHorizontalApply ? form.bannerHorizontalText : "",
    };

    const files: Record<string, File> = {};
    if (docFile) files.document = docFile;
    if (profileFile) files.profilePhoto = profileFile;

    try {
      await onSubmit(data, files);
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ① 문서 업로드 (OCR) */}
      <section className="space-y-3">
        <SectionHeader
          icon="📎"
          title="명함 / 사업자등록증 첨부"
          sub="선택사항 · 업로드 시 아래 정보가 자동 입력됩니다"
        />
        <DocumentUpload onOcrResult={handleOcrResult} onFileChange={setDocFile} />
      </section>

      {/* ② 개인 정보 */}
      <section className="space-y-4">
        <SectionHeader icon="👤" title="개인 정보" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="한글 이름" value={form.nameKo} onChange={(v) => set("nameKo", v)}
            required error={errors.nameKo} placeholder="홍길동"
          />
          <TextField
            label="영문 이름" value={form.nameEn} onChange={(v) => set("nameEn", v)}
            placeholder="Hong Gil Dong"
          />
          <TextField
            label="상호 / 업체명 / 소속" value={form.company} onChange={(v) => set("company", v)}
            placeholder="업체명 또는 소속 기관" className="sm:col-span-2"
          />
          <TextField
            label="생년월일" value={form.birthdate} onChange={(v) => set("birthdate", v)}
            type="date" placeholder="1990-01-01"
          />
          <TextField
            label="연락처" value={form.phone} onChange={(v) => set("phone", formatPhone(v))}
            required error={errors.phone} placeholder="010-0000-0000" type="tel"
          />
          <TextField
            label="이메일" value={form.email} onChange={(v) => set("email", v)}
            required error={errors.email} placeholder="example@email.com" type="email"
            className="sm:col-span-2"
          />
        </div>

        <AddressFields
          postalCode={form.postalCode} address={form.address} addressDetail={form.addressDetail}
          onPostalChange={(v) => set("postalCode", v)}
          onAddressChange={(v) => set("address", v)}
          onDetailChange={(v) => set("addressDetail", v)}
        />

        <ShippingAddressSection
          notice="위촉장 및 위촉패를 등록한 배송지 주소로 발송될 예정입니다."
          sameAddress={form.sameShippingAddress}
          onSameAddressChange={(v) => {
            set("sameShippingAddress", v);
            if (v) {
              set("shippingPostalCode", form.postalCode);
              set("shippingAddress", form.address);
              set("shippingAddressDetail", form.addressDetail);
            }
          }}
          postalCode={form.shippingPostalCode}
          address={form.shippingAddress}
          addressDetail={form.shippingAddressDetail}
          onPostalChange={(v) => set("shippingPostalCode", v)}
          onAddressChange={(v) => set("shippingAddress", v)}
          onDetailChange={(v) => set("shippingAddressDetail", v)}
        />

        <TextField
          label="인스타그램 / SNS 아이디" value={form.sns} onChange={(v) => set("sns", v)}
          placeholder="@instagram_id (선택)"
        />
      </section>

      {/* ③ 조직위 정보 */}
      <section className="space-y-4">
        <SectionHeader icon="📋" title="조직위 정보" />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">직책 / 직위</label>
          <div className="grid grid-cols-2 gap-2">
            {KBA_POSITIONS.map((pos) => {
              const checked = form.position.includes(pos);
              return (
                <label key={pos} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.position, pos]
                        : form.position.filter((p) => p !== pos);
                      set("position", next);
                    }}
                    className="w-4 h-4 rounded border-gray-300 accent-brand shrink-0"
                  />
                  <span className={`text-sm transition-colors ${checked ? "text-gray-900 font-semibold" : "text-gray-600"}`}>
                    {pos}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 참가 희망 종목 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            참가 희망 종목<span className="text-red-500 ml-1">*</span>
          </label>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3 text-xs text-amber-700 space-y-1 leading-relaxed">
            <p className="font-semibold">조직위 직책 우선순위 배정 방법 안내</p>
            <p>1. KBA 협회 직책 및 참여율 우선 순위 배정 (동순위 일 경우 KBA 직책 및 활동정도 순)</p>
            <p>2. 각 직책별 2회차(동일종목기준) 단위로 직책 승급 위촉</p>
            <p>3. 기존 참여 종목 이동 시에는 동일 직책으로 1회 더 위촉 (+1회차 제외)</p>
            <p>4. +3회차 참가시 수석 / 총괄 직책 추가 부여</p>
          </div>
          <div className="space-y-2">
            {IBC_COMMITTEE_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="desiredCategory"
                  value={cat}
                  checked={form.desiredCategory === cat}
                  onChange={() => set("desiredCategory", cat)}
                  className="w-4 h-4 mt-0.5 accent-brand shrink-0"
                />
                <span className={`text-sm transition-colors ${form.desiredCategory === cat ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
          {errors.desiredCategory && <p className="text-red-500 text-xs mt-2">{errors.desiredCategory}</p>}
        </div>
      </section>

      {/* ④ 배너 / 현수막 신청 */}
      <section className="space-y-4">
        <SectionHeader
          icon="🎌"
          title="배너 / 현수막 신청 (선택)"
          sub="신청수량한정 · 선착순마감 · 각 40,000원"
        />

        {/* 조직위 X배너 */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800">조직위 X배너</span>
              <span className="ml-2 text-xs text-brand font-semibold">40,000원</span>
            </div>
            <span className="text-[10px] text-gray-400">신청수량한정 · 선착순</span>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="shrink-0 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/contests/mockup-banner.svg" alt="배너 시안" className="h-52 w-auto object-contain rounded-xl border border-gray-100 shadow-sm" />
              </div>
              <div className="flex-1 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">배너 제작 안내</p>
                <ul className="space-y-1 text-gray-500 leading-relaxed">
                  <li>• 위에 첨부한 프로필 사진으로 작업이 진행됩니다</li>
                  <li>• 다른 사진을 원하시면 이메일로 보내주세요</li>
                  <li className="text-brand font-medium">  kbabeautist@naver.com</li>
                  <li>• 대회 행사 후 개별적으로 가져가실 수 있습니다</li>
                  <li>• 신청 후 시안 작업 완료 시 개별 안내 드립니다</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                  <p className="text-amber-700 font-semibold text-[11px]">💳 입금 안내</p>
                  <p className="text-amber-600 text-[11px] mt-0.5">기업은행 · KBA뷰티스트총연합회</p>
                  <p className="text-amber-600 text-[11px]">010-9293-5659</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => set("bannerApply", val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.bannerApply === val
                      ? val
                        ? "border-brand bg-brand text-white"
                        : "border-gray-400 bg-gray-100 text-gray-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {val ? "✓ 신청합니다" : "신청안함"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 현수막 */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-gray-800">현수막</span>
              <span className="ml-2 text-xs text-brand font-semibold">40,000원</span>
            </div>
            <span className="text-[10px] text-gray-400">신청수량한정 · 선착순</span>
          </div>
          <div className="p-4 space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/contests/mockup-horizontal.svg" alt="현수막 시안" className="w-full rounded-xl border border-gray-100 shadow-sm" />
            <p className="text-xs text-gray-500">상호명(업체명)만 넣으면 더 깔끔합니다. 신청 후 시안 작업 완료 시 개별 안내 드립니다.</p>
            <div className="flex gap-2">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => {
                    set("bannerHorizontalApply", val);
                    if (!val) set("bannerHorizontalText", "");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    form.bannerHorizontalApply === val
                      ? val
                        ? "border-brand bg-brand text-white"
                        : "border-gray-400 bg-gray-100 text-gray-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {val ? "✓ 신청합니다" : "신청안함"}
                </button>
              ))}
            </div>
            {form.bannerHorizontalApply === true && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  현수막 문구 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400">추천: 상호명만 입력하면 더 깔끔합니다 (예: ○○뷰티살롱, ○○아카데미)</p>
                <input
                  type="text"
                  value={form.bannerHorizontalText}
                  onChange={(e) => set("bannerHorizontalText", e.target.value)}
                  placeholder="현수막에 들어갈 문구를 입력하세요"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⑤ 대회 안내사항 (밴드 초대) */}
      <section className="space-y-3">
        <SectionHeader
          icon="📣"
          title="대회 안내사항"
          sub="밴드에서 대회 관련 공지를 받아보실 수 있습니다"
        />
        <a
          href="https://band.us/n/a6aebeQ093y3M"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-[#FFDF00]/10 border border-[#FFDF00]/30 rounded-2xl p-4 hover:bg-[#FFDF00]/20 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFDF00] flex items-center justify-center shrink-0 text-xl font-black text-black shadow-sm">
            b
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 group-hover:text-brand transition-colors">밴드 초대 참여하기</p>
            <p className="text-xs text-gray-500 mt-0.5">제 12회 IBC 국제뷰티스트챔피언쉽 IN 2026</p>
            <p className="text-xs text-brand mt-0.5 truncate">band.us/n/a6aebeQ093y3M</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </section>

      {/* ⑥ 프로필 사진 */}
      <section className="space-y-3">
        <SectionHeader
          icon="🖼"
          title="프로필 사진"
          sub="선택사항 · 대회 책자 및 배너 제작에 사용됩니다"
        />
        <ProfilePhotoUpload file={profileFile} onChange={setProfileFile} />
      </section>

      {/* ⑦ 개인정보 동의 */}
      <section>
        <div className={`rounded-xl border p-4 ${errors.agreePrivacy ? "border-red-300 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
          <div className="text-xs text-gray-600 mb-3 space-y-1">
            <div className="flex gap-8">
              <span className="text-gray-400 w-24 shrink-0">수집 항목</span>
              <span>이름, 연락처, 이메일, 주소</span>
            </div>
            <div className="flex gap-8">
              <span className="text-gray-400 w-24 shrink-0">수집 목적</span>
              <span>대회 진행 및 대회 안내</span>
            </div>
            <div className="flex gap-8">
              <span className="text-gray-400 w-24 shrink-0">보유 기간</span>
              <span>대회 종료 후 1년</span>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreePrivacy}
              onChange={(e) => set("agreePrivacy", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand accent-brand"
            />
            <span className="text-sm font-semibold text-gray-700">
              개인정보 수집 및 이용에 동의합니다<span className="text-red-500 ml-1">*</span>
            </span>
          </label>
          {errors.agreePrivacy && <p className="text-red-500 text-xs mt-2">{errors.agreePrivacy}</p>}
        </div>
      </section>

      <SubmitButton submitting={submitting} label="조직위 신청 접수하기" />
    </form>
  );
}

// ── 메인 래퍼 ────────────────────────────────────────────────

export default function ContestApplyForms({ contest, defaultType = "judge", serverKbaGrade }: { contest: Contest; defaultType?: ApplyType; serverKbaGrade?: string | null }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeType, setActiveType] = useState<ApplyType>(defaultType);
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);

  const canAccessCommittee = serverKbaGrade !== undefined ? !!serverKbaGrade : !!session?.user?.kbaGrade;

  function handleTabClick(type: ApplyType) {
    if (type === "committee" && !canAccessCommittee) {
      setShowCommitteeModal(true);
      return;
    }
    setActiveType(type);
  }

  async function handleSubmit(type: ApplyType, data: Record<string, unknown>, files: Record<string, File>) {
    const fd = new FormData();
    fd.append("formSlug", `contest-${contest.id}-${type}`);
    fd.append("formTitle", `${contest.title} - ${TYPE_TITLE[type]}`);
    fd.append("data", JSON.stringify(data));
    for (const [key, file] of Object.entries(files)) {
      fd.append(`file_${key}`, file);
    }

    const res = await fetch("/api/submissions", { method: "POST", body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "신청 실패" }));
      throw new Error(body.error || "신청 처리 중 오류가 발생했습니다.");
    }
    router.push(`/contests/${contest.id}/apply/complete?type=${type}`);
  }

  // 로딩 중
  if (status === "loading") {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미로그인: 로그인 유도 화면
  if (status === "unauthenticated") {
    return (
      <div className="py-10 text-center">
        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔑</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          대회 신청은 회원 로그인 후 이용하실 수 있습니다.<br />
          Google 계정으로 간편하게 시작하세요.
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: typeof window !== "undefined" ? window.location.href : "/" })}
          className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mx-auto"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 로그인
        </button>
        <p className="text-xs text-gray-400 mt-4">
          계정이 없어도 Google 로그인으로 자동 가입됩니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 유형 선택 탭 */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {TYPE_TABS.map(({ type, label, icon, desc }) => (
          <button
            key={type} type="button" onClick={() => handleTabClick(type)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
              activeType === type
                ? "border-brand bg-brand/5 text-brand shadow-sm"
                : type === "committee" && !canAccessCommittee
                ? "border-gray-100 bg-white text-gray-400 cursor-pointer"
                : "border-gray-100 bg-white text-gray-500 hover:border-brand/30"
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px] text-gray-400">{desc}</span>
            {type === "committee" && !canAccessCommittee && (
              <span className="text-[9px] text-amber-500 font-semibold mt-0.5">권한 필요</span>
            )}
          </button>
        ))}
      </div>

      {/* 대회 정보 스트립 */}
      <div className="bg-brand/5 border border-brand/10 rounded-xl p-4 mb-6">
        <div className="text-xs text-gray-500 mb-0.5">신청 대상 대회</div>
        <div className="text-sm font-bold text-brand">{contest.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{contest.dateDisplay} · {contest.location}</div>
      </div>

      {activeType === "athlete" && (
        <AthleteForm contest={contest} onSubmit={(d, f) => handleSubmit("athlete", d, f)} />
      )}
      {activeType === "judge" && (
        <JudgeForm contest={contest} onSubmit={(d, f) => handleSubmit("judge", d, f)} />
      )}
      {activeType === "committee" && canAccessCommittee && (
        <CommitteeForm contest={contest} onSubmit={(d, f) => handleSubmit("committee", d, f)} />
      )}

      {/* 조직위 신청 제한 안내 모달 */}
      {showCommitteeModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCommitteeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">조직위 신청 안내</h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                조직위 신청은 대회 측에서{" "}
                <strong>조직위 신청 권한이 부여된 회원</strong>만 이용하실 수 있습니다.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-gray-600 mb-3">📞 대회조직위 문의</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">KBA 대표회장</span>
                  <a
                    href="tel:01088425659"
                    className="text-sm font-bold text-brand hover:underline"
                  >
                    010-8842-5659
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">KBA 사무국</span>
                  <a
                    href="tel:01092935659"
                    className="text-sm font-bold text-brand hover:underline"
                  >
                    010-9293-5659
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mb-4 leading-relaxed">
              문의를 통해 권한을 부여받은 후<br />재로그인하시면 신청이 가능합니다.
            </p>

            <button
              type="button"
              onClick={() => setShowCommitteeModal(false)}
              className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-hover transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
