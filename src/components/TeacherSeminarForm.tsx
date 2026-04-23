"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "upcoming" | "open" | "closed" | "completed";

export interface TeacherSeminarFormValues {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  dateDisplay: string;
  startAt: string;
  endAt: string;
  location: string;
  instructorName: string;
  instructorSenderPhone: string;
  instructorNotifyPhones: string;
  price: number;
  capacity: string;
  summary: string;
  description: string;
  curriculum: string;
  target: string;
  tags: string;
  status: Status;
}

const EMPTY: TeacherSeminarFormValues = {
  slug: "",
  title: "",
  subtitle: "",
  dateDisplay: "",
  startAt: "",
  endAt: "",
  location: "",
  instructorName: "",
  instructorSenderPhone: "",
  instructorNotifyPhones: "",
  price: 0,
  capacity: "",
  summary: "",
  description: "",
  curriculum: "",
  target: "",
  tags: "",
  status: "upcoming",
};

export default function TeacherSeminarForm({
  initial,
  mode,
  defaultSenderPhone,
}: {
  initial?: Partial<TeacherSeminarFormValues>;
  mode: "create" | "edit";
  defaultSenderPhone?: string | null;
}) {
  const router = useRouter();
  const [v, setV] = useState<TeacherSeminarFormValues>({
    ...EMPTY,
    instructorSenderPhone: defaultSenderPhone ?? "",
    instructorNotifyPhones: defaultSenderPhone ?? "",
    ...initial,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  function set<K extends keyof TeacherSeminarFormValues>(
    key: K,
    value: TeacherSeminarFormValues[K],
  ) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        slug: v.slug.trim(),
        title: v.title.trim(),
        subtitle: v.subtitle.trim() || null,
        dateDisplay: v.dateDisplay.trim(),
        startAt: v.startAt ? new Date(v.startAt).toISOString() : "",
        endAt: v.endAt ? new Date(v.endAt).toISOString() : null,
        location: v.location.trim(),
        instructorName: v.instructorName.trim(),
        instructorSenderPhone: v.instructorSenderPhone.trim() || null,
        instructorNotifyPhones: v.instructorNotifyPhones.trim() || null,
        price: Number(v.price) || 0,
        capacity: v.capacity ? Number(v.capacity) : null,
        summary: v.summary.trim() || null,
        description: v.description.trim() || null,
        curriculum: splitLines(v.curriculum),
        target: splitLines(v.target),
        tags: splitCommas(v.tags),
        status: v.status,
      };

      const url =
        mode === "create" ? "/api/teacher/seminars" : `/api/teacher/seminars/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "저장 실패" }));
        throw new Error(msg || "저장 실패");
      }
      router.push("/teacher");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!initial?.id) return;
    if (!confirm("정말 삭제할까요? 신청자 데이터는 유지되지만 세미나 정보는 되살릴 수 없습니다.")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teacher/seminars/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      router.push("/teacher");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="기본 정보">
        <Field label="슬러그 (URL)" required hint="영문 소문자/숫자/하이픈 — 예: my-seminar-2026-05">
          <input
            value={v.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            pattern="[a-z0-9\-]+"
            disabled={mode === "edit"}
            placeholder="my-seminar-2026-05"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm disabled:bg-gray-50 disabled:text-gray-500"
          />
        </Field>
        <Field label="제목" required>
          <input
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <Field label="부제">
          <input
            value={v.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <Field label="상태">
          <select
            value={v.status}
            onChange={(e) => set("status", e.target.value as Status)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          >
            <option value="upcoming">예정 (upcoming)</option>
            <option value="open">모집중 (open)</option>
            <option value="closed">마감 (closed)</option>
            <option value="completed">종료 (completed)</option>
          </select>
        </Field>
      </Section>

      <Section title="일시 · 장소">
        <Field label="일시 표시 문구" required hint="예: 2026년 5월 22일 (목) 10:00 – 16:00">
          <input
            value={v.dateDisplay}
            onChange={(e) => set("dateDisplay", e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="시작 시각" required>
            <input
              type="datetime-local"
              value={v.startAt}
              onChange={(e) => set("startAt", e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </Field>
          <Field label="종료 시각">
            <input
              type="datetime-local"
              value={v.endAt}
              onChange={(e) => set("endAt", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </Field>
        </div>
        <Field label="장소" required>
          <input
            value={v.location}
            onChange={(e) => set("location", e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
      </Section>

      <Section title="강사 · 연락처">
        <Field label="강사명 (표시용)" required>
          <input
            value={v.instructorName}
            onChange={(e) => set("instructorName", e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="SMS 발신번호"
            hint="신청자에게 가는 안내 문자 발신번호 (솔라피에 사전등록된 번호)"
          >
            <input
              value={v.instructorSenderPhone}
              onChange={(e) => set("instructorSenderPhone", e.target.value)}
              placeholder="01012345678"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm"
            />
          </Field>
          <Field label="관리자 알림 수신번호" hint="쉼표로 여러 명 지정 가능">
            <input
              value={v.instructorNotifyPhones}
              onChange={(e) => set("instructorNotifyPhones", e.target.value)}
              placeholder="01012345678,01087654321"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm"
            />
          </Field>
        </div>
      </Section>

      <Section title="가격 · 정원">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="참가비 (원)">
            <input
              type="number"
              min={0}
              value={v.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </Field>
          <Field label="정원 (명)">
            <input
              type="number"
              min={1}
              value={v.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </Field>
        </div>
      </Section>

      <Section title="설명">
        <Field label="한줄 요약">
          <input
            value={v.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <Field label="상세 설명">
          <textarea
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
      </Section>

      <Section title="커리큘럼 · 대상 · 태그">
        <Field label="커리큘럼" hint="한 줄에 한 항목">
          <textarea
            value={v.curriculum}
            onChange={(e) => set("curriculum", e.target.value)}
            rows={5}
            placeholder={"항목 1\n항목 2\n항목 3"}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <Field label="추천 대상" hint="한 줄에 한 항목">
          <textarea
            value={v.target}
            onChange={(e) => set("target", e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
        <Field label="태그" hint="쉼표로 구분 — 예: 인스타,자동화,postica">
          <input
            value={v.tags}
            onChange={(e) => set("tags", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl"
          />
        </Field>
      </Section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? "저장 중..." : mode === "create" ? "등록하기" : "수정 저장"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={remove}
            disabled={submitting}
            className="text-sm text-red-500 hover:text-red-600 ml-auto"
          >
            삭제
          </button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <h2 className="text-sm font-bold text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function splitLines(s: string): string[] {
  return s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}
function splitCommas(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
