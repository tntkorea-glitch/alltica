"use client";

import { useState, FormEvent, useRef } from "react";
import { FormTemplate } from "@/lib/types";

interface FormRendererProps {
  form: FormTemplate;
}

export default function FormRenderer({ form }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (name: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCheckbox = (name: string, option: string, checked: boolean) => {
    const current = (formData[name] as string[]) || [];
    const updated = checked
      ? [...current, option]
      : current.filter((v) => v !== option);
    handleChange(name, updated);
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setFiles((prev) => ({ ...prev, [name]: file }));
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of form.fields) {
      if (!field.required) continue;

      if (field.type === "file") {
        if (!files[field.name]) {
          newErrors[field.name] = `${field.label}을(를) 첨부해주세요.`;
        }
      } else if (field.type === "checkbox") {
        const val = formData[field.name] as string[] | undefined;
        if (!val || val.length === 0) {
          newErrors[field.name] = `${field.label}을(를) 하나 이상 선택해주세요.`;
        }
      } else {
        const val = formData[field.name] as string | undefined;
        if (!val || val.trim() === "") {
          newErrors[field.name] = `${field.label}을(를) 입력해주세요.`;
        }
      }

      // Phone format
      if (field.type === "tel" && formData[field.name]) {
        const phone = formData[field.name] as string;
        if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""))) {
          newErrors[field.name] = "올바른 연락처 형식을 입력해주세요. (예: 010-0000-0000)";
        }
      }

      // Email format
      if (field.type === "email" && formData[field.name]) {
        const email = formData[field.name] as string;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          newErrors[field.name] = "올바른 이메일 형식을 입력해주세요.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("formSlug", form.slug);
      fd.append("formTitle", form.title);
      fd.append("data", JSON.stringify(formData));

      for (const [key, file] of Object.entries(files)) {
        fd.append(`file_${key}`, file);
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("제출에 실패했습니다.");

      setSubmitted(true);
    } catch {
      alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">신청이 완료되었습니다!</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          접수된 내용을 확인 후 빠른 시일 내에 연락드리겠습니다.<br />
          감사합니다.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-hover transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      {form.fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === "text" && (
            <input
              type="text"
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
            />
          )}

          {field.type === "tel" && (
            <input
              type="tel"
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder || "010-0000-0000"}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
            />
          )}

          {field.type === "email" && (
            <input
              type="email"
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
            />
          )}

          {field.type === "number" && (
            <input
              type="number"
              min="0"
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
            />
          )}

          {field.type === "date" && (
            <input
              type="date"
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm`}
            />
          )}

          {field.type === "textarea" && (
            <textarea
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm resize-y`}
            />
          )}

          {field.type === "select" && (
            <select
              value={(formData[field.name] as string) || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors text-sm bg-white`}
            >
              <option value="">선택해주세요</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {field.type === "checkbox" && (
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border ${
              errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}>
              {field.options?.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={((formData[field.name] as string[]) || []).includes(opt)}
                    onChange={(e) => handleCheckbox(field.name, opt, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

          {field.type === "file" && (
            <div className={`relative rounded-xl border-2 border-dashed ${
              errors[field.name] ? "border-red-400 bg-red-50" : "border-gray-200"
            } p-6 text-center hover:border-brand/40 transition-colors`}>
              <input
                type="file"
                accept={field.accept}
                onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {files[field.name] ? (
                <p className="text-sm text-brand font-medium">
                  📎 {files[field.name].name}
                </p>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">클릭하여 파일을 선택하세요</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {field.accept?.replace(/\./g, "").replace(/,/g, ", ").toUpperCase() || "모든 파일"}
                  </p>
                </div>
              )}
            </div>
          )}

          {errors[field.name] && (
            <p className="text-red-500 text-xs mt-1.5">{errors[field.name]}</p>
          )}
        </div>
      ))}

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
            제출 중...
          </span>
        ) : (
          "신청서 제출하기"
        )}
      </button>
    </form>
  );
}
