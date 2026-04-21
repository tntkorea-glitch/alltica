"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { Seminar, formatPrice } from "@/lib/seminars";
import { formatPhone } from "@/lib/phone";

interface Props {
  seminar: Seminar;
}

interface FormState {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  attendees: string;
  requests: string;
}

const emptyForm: FormState = {
  name: "",
  company: "",
  position: "",
  phone: "",
  email: "",
  address: "",
  attendees: "1",
  requests: "",
};

export default function SeminarApplyForm({ seminar }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [businessCard, setBusinessCard] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleCardChange(file: File | null) {
    if (!file) return;
    setBusinessCard(file);
    setPreview(URL.createObjectURL(file));
    setOcrState("running");
    setOcrError(null);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/ocr/business-card", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "OCR 요청 실패" }));
        throw new Error(error);
      }
      const { fields } = await res.json();
      setForm((prev) => ({
        ...prev,
        name: fields.name || prev.name,
        company: fields.company || prev.company,
        position: fields.position || prev.position,
        phone: fields.phone || prev.phone,
        email: fields.email || prev.email,
        address: fields.address || prev.address,
      }));
      setOcrState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR 처리에 실패했습니다.";
      setOcrError(msg);
      setOcrState("error");
    }
  }

  function removeCard() {
    setBusinessCard(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setOcrState("idle");
    setOcrError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (form.attendees && (Number(form.attendees) < 1 || isNaN(Number(form.attendees))))
      next.attendees = "참석 인원은 1 이상의 숫자여야 합니다.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          seminarSlug: seminar.slug,
          name: form.name,
          company: form.company,
          position: form.position,
          phone: form.phone,
          email: form.email,
          address: form.address,
          attendees: Number(form.attendees) || 1,
          requests: form.requests,
        })
      );
      if (businessCard) fd.append("businessCard", businessCard);

      const res = await fetch("/api/applications", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "신청 실패" }));
        throw new Error(error || "신청에 실패했습니다.");
      }
      const { id } = await res.json();
      router.push(`/seminars/${seminar.slug}/apply/complete?id=${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "신청 처리에 실패했습니다.";
      alert(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Seminar summary strip */}
      <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/10 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">신청 대상 세미나</div>
          <div className="text-sm font-bold text-[#1e3a5f]">{seminar.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{seminar.dateDisplay}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500">참가비</div>
          <div className="text-base font-extrabold text-[#1e3a5f]">{formatPrice(seminar.price)}</div>
        </div>
      </div>

      {/* Business card upload */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-800">
            명함 업로드 <span className="text-xs font-normal text-gray-400">(선택 · 올리시면 정보가 자동 입력됩니다)</span>
          </label>
          {ocrState === "done" && (
            <span className="text-xs text-emerald-600 font-semibold">✓ 자동 입력 완료 · 내용 확인해주세요</span>
          )}
        </div>

        {!businessCard ? (
          <div className="relative rounded-xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#1e3a5f]/40 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleCardChange(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-3xl mb-2">📇</div>
            <p className="text-sm text-gray-600 font-medium">명함 이미지를 업로드하세요</p>
            <p className="text-xs text-gray-400 mt-1">JPG · PNG · WebP · 최대 8MB</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 p-4 flex gap-4 items-center">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="명함 미리보기" className="w-24 h-16 object-cover rounded border border-gray-200" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{businessCard.name}</div>
              <div className="text-xs mt-0.5">
                {ocrState === "running" && (
                  <span className="text-[#1e3a5f] inline-flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    명함 정보 추출 중...
                  </span>
                )}
                {ocrState === "done" && <span className="text-emerald-600">정보 자동 입력됨</span>}
                {ocrState === "error" && <span className="text-red-500">{ocrError}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={removeCard}
              className="text-sm text-gray-500 hover:text-red-500 font-medium shrink-0"
            >
              삭제
            </button>
          </div>
        )}
      </section>

      {/* Manual fields (always visible, pre-filled from OCR if present) */}
      <section className="space-y-5">
        <h2 className="text-sm font-bold text-gray-800">신청자 정보</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="이름"
            value={form.name}
            onChange={(v) => updateField("name", v)}
            required
            error={errors.name}
            placeholder="홍길동"
          />
          <TextField
            label="연락처"
            value={form.phone}
            onChange={(v) => updateField("phone", v)}
            required
            error={errors.phone}
            placeholder="010-0000-0000"
            type="tel"
          />
          <TextField
            label="상호 / 회사명"
            value={form.company}
            onChange={(v) => updateField("company", v)}
            placeholder="회사 또는 상호명"
          />
          <TextField
            label="직책"
            value={form.position}
            onChange={(v) => updateField("position", v)}
            placeholder="직책 (선택)"
          />
          <TextField
            label="이메일"
            value={form.email}
            onChange={(v) => updateField("email", v)}
            error={errors.email}
            placeholder="example@email.com"
            type="email"
            className="sm:col-span-2"
          />
          <TextField
            label="주소"
            value={form.address}
            onChange={(v) => updateField("address", v)}
            placeholder="사업장 또는 자택 주소"
            className="sm:col-span-2"
          />
          <TextField
            label="참석 인원"
            value={form.attendees}
            onChange={(v) => updateField("attendees", v)}
            error={errors.attendees}
            type="number"
            placeholder="1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">요청사항</label>
          <textarea
            value={form.requests}
            onChange={(e) => updateField("requests", e.target.value)}
            rows={3}
            placeholder="추가 요청사항이 있으시면 입력해주세요"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-colors text-sm resize-y"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#1e3a5f] text-white py-4 rounded-xl font-bold text-base hover:bg-[#16304f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#1e3a5f]/20"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            신청 접수 중...
          </span>
        ) : (
          "신청 접수하기"
        )}
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-colors text-sm`}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
