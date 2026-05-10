"use client";

import { useState, FormEvent } from "react";
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
const JUDGE_CAREER_OPTIONS = ["5–10년", "10–15년", "15년 이상"];
const COMMITTEE_ROLES = ["현장진행", "심판보조", "접수/안내", "홍보/마케팅", "촬영/기록", "기타"];

// ── 공통 필드 컴포넌트 ──────────────────────────────────────

function TextField({
  label, value, onChange, required, error, placeholder, type = "text", className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; error?: string; placeholder?: string; type?: string; className?: string;
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
        } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
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
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm bg-white`}
      >
        <option value="">{placeholder || "선택해주세요"}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
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
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
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
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function TextareaField({
  label, value, onChange, required, error, placeholder, rows = 4, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; error?: string; placeholder?: string; rows?: number; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm resize-y`}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
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
      ) : (
        label
      )}
    </button>
  );
}

// ── 선수 신청 폼 ──────────────────────────────────────────

interface AthleteState {
  name: string; birthdate: string; phone: string; email: string;
  affiliation: string; career: string; divisions: string[];
  certificates: string; requests: string;
}

const emptyAthlete: AthleteState = {
  name: "", birthdate: "", phone: "", email: "",
  affiliation: "", career: "", divisions: [], certificates: "", requests: "",
};

function AthleteForm({ contest, onSubmit }: { contest: Contest; onSubmit: (data: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState<AthleteState>(emptyAthlete);
  const [errors, setErrors] = useState<Partial<Record<keyof AthleteState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof AthleteState>(key: K, val: AthleteState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
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
    try {
      await onSubmit({ ...form });
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="이름" value={form.name} onChange={(v) => update("name", v)} required error={errors.name} placeholder="홍길동" />
        <TextField label="생년월일" value={form.birthdate} onChange={(v) => update("birthdate", v)} type="date" placeholder="1990-01-01" />
        <TextField label="연락처" value={form.phone} onChange={(v) => update("phone", formatPhone(v))} required error={errors.phone} placeholder="010-0000-0000" type="tel" />
        <TextField label="이메일" value={form.email} onChange={(v) => update("email", v)} error={errors.email} placeholder="example@email.com" type="email" />
        <TextField label="소속 (샵/살롱/학원명)" value={form.affiliation} onChange={(v) => update("affiliation", v)} placeholder="없으면 '개인'" className="sm:col-span-2" />
        <SelectField label="경력" value={form.career} onChange={(v) => update("career", v)} options={CAREER_OPTIONS} placeholder="경력 선택" className="sm:col-span-2" />
      </div>

      <CheckboxGroup
        label="신청 부문"
        options={contest.tags}
        selected={form.divisions}
        onChange={(v) => update("divisions", v)}
        required
        error={errors.divisions}
      />

      <TextareaField label="자격증 보유 현황" value={form.certificates} onChange={(v) => update("certificates", v)} placeholder="보유 자격증을 입력해주세요 (없으면 생략)" rows={3} />
      <TextareaField label="요청사항" value={form.requests} onChange={(v) => update("requests", v)} placeholder="기타 요청사항이 있으시면 입력해주세요" rows={3} />
      <SubmitButton submitting={submitting} label="선수 신청 접수하기" />
    </form>
  );
}

// ── 심사위원 신청 폼 ──────────────────────────────────────────

interface JudgeState {
  name: string; phone: string; email: string; affiliation: string;
  position: string; specialties: string[]; career: string;
  experience: string; introduction: string;
}

const emptyJudge: JudgeState = {
  name: "", phone: "", email: "", affiliation: "",
  position: "", specialties: [], career: "", experience: "", introduction: "",
};

function JudgeForm({ contest, onSubmit }: { contest: Contest; onSubmit: (data: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState<JudgeState>(emptyJudge);
  const [errors, setErrors] = useState<Partial<Record<keyof JudgeState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof JudgeState>(key: K, val: JudgeState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof JudgeState, string>> = {};
    if (!form.name.trim()) next.name = "이름을 입력해주세요.";
    if (!form.phone.trim()) next.phone = "연락처를 입력해주세요.";
    else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      next.phone = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
    if (!form.email.trim()) next.email = "이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "올바른 이메일 형식을 입력해주세요.";
    if (!form.affiliation.trim()) next.affiliation = "소속을 입력해주세요.";
    if (!form.position.trim()) next.position = "직책을 입력해주세요.";
    if (!form.introduction.trim()) next.introduction = "자기소개를 입력해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...form });
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="이름" value={form.name} onChange={(v) => update("name", v)} required error={errors.name} placeholder="홍길동" />
        <TextField label="연락처" value={form.phone} onChange={(v) => update("phone", formatPhone(v))} required error={errors.phone} placeholder="010-0000-0000" type="tel" />
        <TextField label="이메일" value={form.email} onChange={(v) => update("email", v)} required error={errors.email} placeholder="example@email.com" type="email" className="sm:col-span-2" />
        <TextField label="소속" value={form.affiliation} onChange={(v) => update("affiliation", v)} required error={errors.affiliation} placeholder="소속 기관/업체명" />
        <TextField label="직책" value={form.position} onChange={(v) => update("position", v)} required error={errors.position} placeholder="직책 또는 직위" />
        <SelectField label="관련 경력" value={form.career} onChange={(v) => update("career", v)} options={JUDGE_CAREER_OPTIONS} placeholder="경력 선택" className="sm:col-span-2" />
      </div>

      <CheckboxGroup
        label="전문 분야 (해당하는 것 모두 선택)"
        options={contest.tags}
        selected={form.specialties}
        onChange={(v) => update("specialties", v)}
      />

      <TextareaField label="심사위원 활동 경험" value={form.experience} onChange={(v) => update("experience", v)} placeholder="이전 심사위원 경험이 있으시면 입력해주세요 (없으면 생략)" rows={3} />
      <TextareaField label="자기소개" value={form.introduction} onChange={(v) => update("introduction", v)} required error={errors.introduction} placeholder="전문성 및 심사위원 활동 의지를 포함한 자기소개를 작성해주세요" rows={5} />
      <SubmitButton submitting={submitting} label="심사위원 신청 접수하기" />
    </form>
  );
}

// ── 조직위 신청 폼 ──────────────────────────────────────────

interface CommitteeState {
  name: string; phone: string; email: string;
  affiliationPosition: string; desiredRole: string;
  experience: string; motivation: string;
}

const emptyCommittee: CommitteeState = {
  name: "", phone: "", email: "",
  affiliationPosition: "", desiredRole: "", experience: "", motivation: "",
};

function CommitteeForm({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState<CommitteeState>(emptyCommittee);
  const [errors, setErrors] = useState<Partial<Record<keyof CommitteeState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof CommitteeState>(key: K, val: CommitteeState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
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
    try {
      await onSubmit({ ...form });
    } catch (err) {
      alert(err instanceof Error ? err.message : "신청 처리에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="이름" value={form.name} onChange={(v) => update("name", v)} required error={errors.name} placeholder="홍길동" />
        <TextField label="연락처" value={form.phone} onChange={(v) => update("phone", formatPhone(v))} required error={errors.phone} placeholder="010-0000-0000" type="tel" />
        <TextField label="이메일" value={form.email} onChange={(v) => update("email", v)} required error={errors.email} placeholder="example@email.com" type="email" className="sm:col-span-2" />
        <TextField label="소속 / 직책" value={form.affiliationPosition} onChange={(v) => update("affiliationPosition", v)} placeholder="소속 및 직책 (선택)" className="sm:col-span-2" />
        <SelectField label="희망 역할" value={form.desiredRole} onChange={(v) => update("desiredRole", v)} options={COMMITTEE_ROLES} required error={errors.desiredRole} placeholder="역할 선택" className="sm:col-span-2" />
      </div>

      <TextareaField label="관련 경험" value={form.experience} onChange={(v) => update("experience", v)} placeholder="관련 경험이 있으시면 입력해주세요 (없으면 생략)" rows={3} />
      <TextareaField label="지원 동기" value={form.motivation} onChange={(v) => update("motivation", v)} required error={errors.motivation} placeholder="조직위원으로 활동하고자 하는 동기를 작성해주세요" rows={4} />
      <SubmitButton submitting={submitting} label="조직위 신청 접수하기" />
    </form>
  );
}

// ── 메인 래퍼 ──────────────────────────────────────────

export default function ContestApplyForms({ contest }: { contest: Contest }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ApplyType>("athlete");

  async function handleSubmit(type: ApplyType, data: Record<string, unknown>) {
    const fd = new FormData();
    fd.append("formSlug", `contest-${contest.id}-${type}`);
    fd.append("formTitle", `${contest.title} - ${TYPE_TITLE[type]}`);
    fd.append("data", JSON.stringify(data));

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
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
              activeType === type
                ? "border-brand bg-brand/5 text-brand"
                : "border-gray-100 bg-white text-gray-500 hover:border-brand/30"
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-semibold">{label}</span>
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
        <AthleteForm contest={contest} onSubmit={(data) => handleSubmit("athlete", data)} />
      )}
      {activeType === "judge" && (
        <JudgeForm contest={contest} onSubmit={(data) => handleSubmit("judge", data)} />
      )}
      {activeType === "committee" && (
        <CommitteeForm onSubmit={(data) => handleSubmit("committee", data)} />
      )}
    </div>
  );
}
