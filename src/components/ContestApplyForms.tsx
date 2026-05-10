"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
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

// ── 심사위원 신청 폼 ────────────────────────────────────────────────

interface JudgeState {
  nameKo: string; nameEn: string; company: string; birthdate: string;
  phone: string; email: string;
  postalCode: string; address: string; addressDetail: string;
  sns: string; position: string;
  specialties: string[]; qualifications: string;
  agreePrivacy: boolean;
}

const emptyJudge: JudgeState = {
  nameKo: "", nameEn: "", company: "", birthdate: "",
  phone: "", email: "",
  postalCode: "", address: "", addressDetail: "",
  sns: "", position: "",
  specialties: [], qualifications: "",
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

    const data: Record<string, unknown> = {
      한글이름: form.nameKo,
      영문이름: form.nameEn,
      상호업체명: form.company,
      생년월일: form.birthdate,
      연락처: form.phone,
      이메일: form.email,
      주소: fullAddress,
      SNS아이디: form.sns,
      직책: form.position,
      심사종목: form.specialties,
      자격요건경력사항: form.qualifications,
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
        <TextareaField
          label="자격요건 및 경력사항"
          value={form.qualifications}
          onChange={(v) => set("qualifications", v)}
          hint="※ 심사위원 기본 자격요건 (아래 중 1개 이상 해당) ▶ 미용대회 수상경력 2회 이상 ▶ 미용업종 경력 2년 이상 ▶ 미용학과/관련학과 졸업자 및 학위 보유자"
          placeholder="경력사항 / 자격사항 / 수상경력 등을 자유롭게 작성해주세요"
          rows={4}
        />
      </section>

      {/* ④ 프로필 사진 */}
      <section className="space-y-3">
        <SectionHeader
          icon="🖼"
          title="프로필 사진"
          sub="선택사항 · 대회 책자에 등록됩니다"
        />
        <ProfilePhotoUpload file={profileFile} onChange={setProfileFile} />
      </section>

      {/* ⑤ 개인정보 동의 */}
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
  name: string; birthdate: string; phone: string; email: string;
  affiliation: string; career: string; divisions: string[];
  certificates: string; requests: string;
}

const emptyAthlete: AthleteState = {
  name: "", birthdate: "", phone: "", email: "",
  affiliation: "", career: "", divisions: [], certificates: "", requests: "",
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

  function handleOcrResult(fields: { name?: string; company?: string; phone?: string; email?: string }, _postal: string, _addr: string) {
    setForm((p) => ({
      ...p,
      name: fields.name || p.name,
      affiliation: fields.company || p.affiliation,
      phone: fields.phone ? formatPhone(fields.phone) : p.phone,
      email: fields.email || p.email,
    }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof AthleteState, string>> = {};
    if (!form.name.trim()) next.name = "이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (form.divisions.length === 0) next.divisions = "신청 부문을 하나 이상 선택해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const files: Record<string, File> = {};
    if (docFile) files.document = docFile;
    try {
      await onSubmit({ ...form }, files);
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
          <TextField label="이름" value={form.name} onChange={(v) => update("name", v)} required error={errors.name} placeholder="홍길동" />
          <TextField label="생년월일" value={form.birthdate} onChange={(v) => update("birthdate", v)} type="date" />
          <TextField label="연락처" value={form.phone} onChange={(v) => update("phone", formatPhone(v))} required error={errors.phone} placeholder="010-0000-0000" type="tel" />
          <TextField label="이메일" value={form.email} onChange={(v) => update("email", v)} error={errors.email} placeholder="example@email.com" type="email" />
          <TextField label="소속 (샵/살롱/학원명)" value={form.affiliation} onChange={(v) => update("affiliation", v)} placeholder="없으면 '개인'" className="sm:col-span-2" />
          <SelectField label="경력" value={form.career} onChange={(v) => update("career", v)} options={CAREER_OPTIONS} placeholder="경력 선택" className="sm:col-span-2" />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader icon="🏅" title="신청 정보" />
        <CheckboxGroup
          label="신청 부문" options={contest.tags} selected={form.divisions}
          onChange={(v) => update("divisions", v)} required error={errors.divisions}
        />
        <TextareaField label="자격증 보유 현황" value={form.certificates} onChange={(v) => update("certificates", v)} placeholder="보유 자격증 (없으면 생략)" rows={3} />
        <TextareaField label="요청사항" value={form.requests} onChange={(v) => update("requests", v)} placeholder="기타 요청사항" rows={3} />
      </section>

      <SubmitButton submitting={submitting} label="선수 신청 접수하기" />
    </form>
  );
}

// ── 조직위 신청 폼 ────────────────────────────────────────────────

interface CommitteeState {
  name: string; phone: string; email: string;
  affiliationPosition: string; desiredRole: string;
  experience: string; motivation: string;
}

const emptyCommittee: CommitteeState = {
  name: "", phone: "", email: "",
  affiliationPosition: "", desiredRole: "", experience: "", motivation: "",
};

function CommitteeForm({
  onSubmit,
}: {
  onSubmit: (data: Record<string, unknown>, files: Record<string, File>) => Promise<void>;
}) {
  const [form, setForm] = useState<CommitteeState>(emptyCommittee);
  const [errors, setErrors] = useState<Partial<Record<keyof CommitteeState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);

  function update<K extends keyof CommitteeState>(key: K, val: CommitteeState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function handleOcrResult(fields: { name?: string; company?: string; position?: string; phone?: string; email?: string }, _postal: string, _addr: string) {
    setForm((p) => ({
      ...p,
      name: fields.name || p.name,
      affiliationPosition: [fields.company, fields.position].filter(Boolean).join(" / ") || p.affiliationPosition,
      phone: fields.phone ? formatPhone(fields.phone) : p.phone,
      email: fields.email || p.email,
    }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof CommitteeState, string>> = {};
    if (!form.name.trim()) next.name = "이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (!form.email.trim()) next.email = "이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (!form.desiredRole) next.desiredRole = "희망 역할을 선택해주세요.";
    if (!form.motivation.trim()) next.motivation = "지원 동기를 입력해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const files: Record<string, File> = {};
    if (docFile) files.document = docFile;
    try {
      await onSubmit({ ...form }, files);
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
          <TextField label="이름" value={form.name} onChange={(v) => update("name", v)} required error={errors.name} placeholder="홍길동" />
          <TextField label="연락처" value={form.phone} onChange={(v) => update("phone", formatPhone(v))} required error={errors.phone} placeholder="010-0000-0000" type="tel" />
          <TextField label="이메일" value={form.email} onChange={(v) => update("email", v)} required error={errors.email} placeholder="example@email.com" type="email" className="sm:col-span-2" />
          <TextField label="소속 / 직책" value={form.affiliationPosition} onChange={(v) => update("affiliationPosition", v)} placeholder="소속 및 직책 (선택)" className="sm:col-span-2" />
          <SelectField label="희망 역할" value={form.desiredRole} onChange={(v) => update("desiredRole", v)} options={COMMITTEE_ROLES} required error={errors.desiredRole} placeholder="역할 선택" className="sm:col-span-2" />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader icon="📋" title="지원 내용" />
        <TextareaField label="관련 경험" value={form.experience} onChange={(v) => update("experience", v)} placeholder="관련 경험이 있으시면 입력해주세요 (없으면 생략)" rows={3} />
        <TextareaField label="지원 동기" value={form.motivation} onChange={(v) => update("motivation", v)} required error={errors.motivation} placeholder="조직위원으로 활동하고자 하는 동기를 작성해주세요" rows={4} />
      </section>

      <SubmitButton submitting={submitting} label="조직위 신청 접수하기" />
    </form>
  );
}

// ── 메인 래퍼 ────────────────────────────────────────────────

export default function ContestApplyForms({ contest }: { contest: Contest }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ApplyType>("judge");

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

  return (
    <div>
      {/* 유형 선택 탭 */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {TYPE_TABS.map(({ type, label, icon, desc }) => (
          <button
            key={type} type="button" onClick={() => setActiveType(type)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
              activeType === type
                ? "border-brand bg-brand/5 text-brand shadow-sm"
                : "border-gray-100 bg-white text-gray-500 hover:border-brand/30"
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px] text-gray-400">{desc}</span>
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
      {activeType === "committee" && (
        <CommitteeForm onSubmit={(d, f) => handleSubmit("committee", d, f)} />
      )}
    </div>
  );
}
