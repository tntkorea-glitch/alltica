"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";

interface Applicant {
  id: string;
  seminar_slug: string;
  seminar_title: string;
  seminar_price: number | null;
  name: string;
  company: string | null;
  position: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  attendees: number;
  requests: string | null;
  business_card_url: string | null;
  business_card_signed_url: string | null;
  status: "pending" | "confirmed" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  notes: string | null;
  created_at: string;
}

interface SeminarInfo {
  id: string;
  slug: string;
  title: string;
}

function formatKST(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [seminar, setSeminar] = useState<SeminarInfo | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Applicant | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teacher/seminars/${id}/applicants`);
        if (res.status === 401 || res.status === 403) {
          window.location.href = `/login?callbackUrl=/teacher/seminars/${id}/applicants`;
          return;
        }
        if (!res.ok) throw new Error("조회 실패");
        const data = await res.json();
        setSeminar(data.seminar);
        setApplicants(data.applicants);
      } catch (e) {
        setError(e instanceof Error ? e.message : "조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/teacher/seminars/${id}`}
          className="text-sm text-gray-500 hover:text-brand transition-colors"
        >
          ← 세미나 수정
        </Link>
        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">신청자 명단</h1>
          {seminar && (
            <p className="text-sm text-gray-500 mt-1">
              {seminar.title}{" "}
              <span className="font-mono text-xs text-gray-400">/{seminar.slug}</span>
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-12">{error}</p>
        ) : applicants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-500 text-sm">아직 신청자가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-gray-500">
              총 <b className="text-brand">{applicants.length}</b>명
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <Th>접수일시</Th>
                    <Th>이름</Th>
                    <Th>상호</Th>
                    <Th>연락처</Th>
                    <Th>이메일</Th>
                    <Th>상태</Th>
                    <Th>명함</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applicants.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <Td className="text-gray-500 text-xs whitespace-nowrap">
                        {formatKST(a.created_at)}
                      </Td>
                      <Td className="font-semibold whitespace-nowrap">{a.name}</Td>
                      <Td className="text-gray-600 whitespace-nowrap">{a.company || "-"}</Td>
                      <Td className="text-gray-600 whitespace-nowrap">
                        {formatPhone(a.phone)}
                      </Td>
                      <Td className="text-gray-600 whitespace-nowrap">{a.email || "-"}</Td>
                      <Td>
                        <span className="text-xs text-gray-500">
                          {a.status === "confirmed"
                            ? "확정"
                            : a.status === "cancelled"
                              ? "취소"
                              : "대기"}{" "}
                          /{" "}
                          {a.payment_status === "paid"
                            ? "입금"
                            : a.payment_status === "refunded"
                              ? "환불"
                              : "미입금"}
                        </span>
                      </Td>
                      <Td>
                        {a.business_card_signed_url ? (
                          <a
                            href={a.business_card_signed_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-brand hover:underline"
                          >
                            보기
                          </a>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-4">{selected.name}</h3>
            <dl className="space-y-2 text-sm">
              <DRow label="접수일시" value={formatKST(selected.created_at)} />
              <DRow label="상호/회사" value={selected.company || "-"} />
              <DRow label="직책" value={selected.position || "-"} />
              <DRow label="연락처" value={formatPhone(selected.phone)} />
              <DRow label="이메일" value={selected.email || "-"} />
              <DRow label="주소" value={selected.address || "-"} />
              <DRow label="참석 인원" value={`${selected.attendees}명`} />
              <DRow label="요청사항" value={selected.requests || "-"} />
            </dl>
            {selected.business_card_signed_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.business_card_signed_url}
                alt="명함"
                className="mt-4 w-full rounded-lg border border-gray-100"
              />
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full py-2.5 bg-gray-100 rounded-lg text-sm font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{children}</th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-gray-500 w-20 shrink-0">{label}</dt>
      <dd className="text-gray-800 flex-1">{value}</dd>
    </div>
  );
}
