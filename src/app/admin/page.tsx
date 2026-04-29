"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatPhone } from "@/lib/phone";
import { formatPrice, type Seminar } from "@/lib/seminars";
import { Submission } from "@/lib/types";
import { formTemplates } from "@/lib/forms";
import { THEMES, ThemeId } from "@/lib/theme";

type ApplicationStatus = "pending" | "confirmed" | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "refunded";

interface Application {
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
  status: ApplicationStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "대기",
  confirmed: "확정",
  cancelled: "취소",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "미입금",
  paid: "입금완료",
  refunded: "환불",
};

const STATUS_TONE: Record<ApplicationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};
const PAYMENT_TONE: Record<PaymentStatus, string> = {
  unpaid: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-gray-100 text-gray-500 border-gray-200",
};

function formatKST(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim();
  return cleaned.length > 31 ? cleaned.slice(0, 31) : cleaned || "Sheet";
}

export default function AdminPage() {
  const [tab, setTab] = useState<"seminars" | "forms" | "users" | "settings">("seminars");

  // Seminar applications
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [filterTitle, setFilterTitle] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Old form submissions (일반 문의 / 제품 / 인재 / 파트너)
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [formFilterSlug, setFormFilterSlug] = useState("");
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const [allSeminars, setAllSeminars] = useState<Seminar[]>([]);

  useEffect(() => {
    fetch("/api/seminars")
      .then((r) => r.json())
      .then(setAllSeminars)
      .catch(() => {});
  }, []);

  const fetchApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res = await fetch(`/api/applications`);
      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin";
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data: Application[] = await res.json();
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  const fetchSubs = useCallback(async () => {
    setSubsLoading(true);
    try {
      const url = `/api/submissions${formFilterSlug ? `?formSlug=${formFilterSlug}` : ""}`;
      const res = await fetch(url);
      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin";
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data: Submission[] = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubsLoading(false);
    }
  }, [formFilterSlug]);

  useEffect(() => {
    if (tab === "seminars") fetchApps();
    else fetchSubs();
  }, [tab, fetchApps, fetchSubs]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  // Group applications by seminar title (postica 7개 세션 합쳐서 표시)
  const titleGroups = useMemo(() => {
    const map = new Map<string, Application[]>();
    for (const a of apps) {
      const arr = map.get(a.seminar_title) || [];
      arr.push(a);
      map.set(a.seminar_title, arr);
    }
    return map;
  }, [apps]);

  const filteredApps = useMemo(() => {
    let list = apps;
    if (filterTitle) list = list.filter((a) => a.seminar_title === filterTitle);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.phone.includes(q.replace(/\D/g, "")) ||
          (a.company || "").toLowerCase().includes(q) ||
          (a.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, filterTitle, search]);

  function rowsToSheet(list: Application[]) {
    return list.map((r) => {
      const sem = allSeminars.find((s) => s.slug === r.seminar_slug);
      return {
        접수일시: formatKST(r.created_at),
        세미나: r.seminar_title,
        일시: sem?.dateDisplay || "",
        이름: r.name,
        "상호/회사": r.company || "",
        직책: r.position || "",
        연락처: formatPhone(r.phone),
        이메일: r.email || "",
        주소: r.address || "",
        참석인원: r.attendees,
        참가비: r.seminar_price ?? "",
        상태: STATUS_LABEL[r.status],
        결제: PAYMENT_LABEL[r.payment_status],
        요청사항: r.requests || "",
        명함: r.business_card_signed_url || "",
        메모: r.notes || "",
      };
    });
  }

  function exportExcel() {
    if (apps.length === 0) {
      alert("내보낼 신청 데이터가 없습니다.");
      return;
    }
    const wb = XLSX.utils.book_new();

    // 전체 시트
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsToSheet(apps)), "전체");

    // 세미나 제목별 시트
    for (const [title, list] of titleGroups.entries()) {
      const name = sanitizeSheetName(title);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsToSheet(list)), name);
    }

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `alltica-세미나신청-${today}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">Alltica 관리자</h1>
            <p className="text-xs text-gray-500 truncate">세미나 신청 및 문의 현황 관리</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-gray-500 hover:text-brand transition-colors px-2">
              사이트로
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-1 border-b border-gray-100 -mb-4">
          <TabButton active={tab === "seminars"} onClick={() => setTab("seminars")}>
            🎓 세미나 신청{" "}
            <span className="ml-1 text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded">
              {apps.length}
            </span>
          </TabButton>
          <TabButton active={tab === "forms"} onClick={() => setTab("forms")}>
            📝 일반 문의{" "}
            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {submissions.length}
            </span>
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            👥 사용자
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
            ⚙️ 설정
          </TabButton>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === "seminars" && (
          <SeminarsTab
            apps={apps}
            filteredApps={filteredApps}
            loading={appsLoading}
            titleGroups={titleGroups}
            filterTitle={filterTitle}
            setFilterTitle={setFilterTitle}
            search={search}
            setSearch={setSearch}
            onRefresh={fetchApps}
            onExport={exportExcel}
            onRowClick={setSelectedApp}
            allSeminars={allSeminars}
          />
        )}
        {tab === "forms" && (
          <FormsTab
            submissions={submissions}
            loading={subsLoading}
            filterSlug={formFilterSlug}
            setFilterSlug={setFormFilterSlug}
            onRefresh={fetchSubs}
            onRowClick={setSelectedSub}
          />
        )}
        {tab === "users" && <UsersTab />}
        {tab === "settings" && <SettingsTab />}
      </div>

      {selectedApp && (
        <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} allSeminars={allSeminars} />
      )}
      {selectedSub && (
        <SubmissionDetailModal sub={selectedSub} onClose={() => setSelectedSub(null)} />
      )}
    </div>
  );
}

// ============================================================

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? "border-brand text-brand"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================
// Seminars tab
// ============================================================
function SeminarsTab({
  apps,
  filteredApps,
  loading,
  titleGroups,
  filterTitle,
  setFilterTitle,
  search,
  setSearch,
  onRefresh,
  onExport,
  onRowClick,
  allSeminars,
}: {
  apps: Application[];
  filteredApps: Application[];
  loading: boolean;
  titleGroups: Map<string, Application[]>;
  filterTitle: string;
  setFilterTitle: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onRowClick: (a: Application) => void;
  allSeminars: Seminar[];
}) {
  return (
    <>
      {/* Stats by seminar title */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="전체"
          count={apps.length}
          active={filterTitle === ""}
          onClick={() => setFilterTitle("")}
          tone="primary"
        />
        {[...titleGroups.entries()].map(([title, list]) => (
          <StatCard
            key={title}
            label={title}
            count={list.length}
            active={filterTitle === title}
            onClick={() => setFilterTitle(filterTitle === title ? "" : title)}
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 mb-5 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 / 상호 / 연락처 / 이메일 검색"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand"
        />
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          새로고침
        </button>
        <button
          onClick={onExport}
          className="px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          엑셀 다운로드
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">
            신청 목록{" "}
            <span className="text-gray-400 font-normal ml-1">
              ({filteredApps.length}
              {filteredApps.length !== apps.length ? ` / ${apps.length}` : ""})
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {apps.length === 0 ? "아직 접수된 세미나 신청이 없습니다." : "조건에 맞는 신청이 없습니다."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <Th>접수일시</Th>
                  <Th>세미나</Th>
                  <Th>이름</Th>
                  <Th>상호</Th>
                  <Th>직책</Th>
                  <Th>연락처</Th>
                  <Th>이메일</Th>
                  <Th>상태</Th>
                  <Th>결제</Th>
                  <Th>명함</Th>
                  <Th>상세</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredApps.map((app) => {
                  const sem = allSeminars.find((s) => s.slug === app.seminar_slug);
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <Td className="text-gray-500 text-xs whitespace-nowrap">
                        {formatKST(app.created_at)}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <div className="text-xs text-gray-800 font-medium">{app.seminar_title}</div>
                        <div className="text-[11px] text-gray-400">{sem?.dateDisplay}</div>
                      </Td>
                      <Td className="font-semibold text-gray-900 whitespace-nowrap">{app.name}</Td>
                      <Td className="text-gray-600 whitespace-nowrap">{app.company || "-"}</Td>
                      <Td className="text-gray-600 whitespace-nowrap">{app.position || "-"}</Td>
                      <Td className="text-gray-600 whitespace-nowrap">{formatPhone(app.phone)}</Td>
                      <Td className="text-gray-600 whitespace-nowrap">{app.email || "-"}</Td>
                      <Td>
                        <Badge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={PAYMENT_TONE[app.payment_status]}>
                          {PAYMENT_LABEL[app.payment_status]}
                        </Badge>
                      </Td>
                      <Td>
                        {app.business_card_signed_url ? (
                          <a
                            href={app.business_card_signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline text-xs"
                          >
                            📇 보기
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </Td>
                      <Td>
                        <button
                          onClick={() => onRowClick(app)}
                          className="text-brand hover:underline text-xs font-semibold"
                        >
                          상세
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  count,
  active,
  onClick,
  tone = "normal",
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: "normal" | "primary";
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border text-left transition-all ${
        active
          ? "border-brand ring-2 ring-brand/20 shadow-sm"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <p className={`text-2xl font-bold ${tone === "primary" ? "text-brand" : "text-gray-900"}`}>
        {count}
      </p>
      <p className="text-xs text-gray-500 truncate mt-0.5" title={label}>
        {label}
      </p>
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${tone}`}>
      {children}
    </span>
  );
}

// ============================================================
// Detail modals
// ============================================================
function ApplicationDetailModal({
  app,
  onClose,
  allSeminars,
}: {
  app: Application;
  onClose: () => void;
  allSeminars: Seminar[];
}) {
  const sem = allSeminars.find((s) => s.slug === app.seminar_slug);
  return (
    <Modal onClose={onClose} title={app.seminar_title} subtitle={formatKST(app.created_at)}>
      <div className="space-y-5">
        {/* 세미나 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
          <Row label="일시">{sem?.dateDisplay || "-"}</Row>
          <Row label="장소">{sem?.location || "-"}</Row>
          <Row label="참가비">
            {app.seminar_price ? formatPrice(app.seminar_price) : "-"}
          </Row>
        </div>

        {/* 신청자 */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 mb-2">신청자 정보</h4>
          <div className="space-y-1.5 text-sm">
            <Row label="이름">{app.name}</Row>
            <Row label="상호/회사">{app.company || "-"}</Row>
            <Row label="직책">{app.position || "-"}</Row>
            <Row label="연락처">
              <a href={`tel:${app.phone}`} className="text-brand hover:underline">
                {formatPhone(app.phone)}
              </a>
            </Row>
            <Row label="이메일">
              {app.email ? (
                <a href={`mailto:${app.email}`} className="text-brand hover:underline">
                  {app.email}
                </a>
              ) : (
                "-"
              )}
            </Row>
            <Row label="주소">{app.address || "-"}</Row>
            <Row label="참석인원">{app.attendees}명</Row>
          </div>
        </section>

        {/* 상태 */}
        <section>
          <h4 className="text-xs font-bold text-gray-500 mb-2">상태</h4>
          <div className="flex gap-2">
            <Badge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Badge>
            <Badge tone={PAYMENT_TONE[app.payment_status]}>
              {PAYMENT_LABEL[app.payment_status]}
            </Badge>
          </div>
        </section>

        {app.requests && (
          <section>
            <h4 className="text-xs font-bold text-gray-500 mb-2">요청사항</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">
              {app.requests}
            </p>
          </section>
        )}

        {app.business_card_signed_url && (
          <section>
            <h4 className="text-xs font-bold text-gray-500 mb-2">명함</h4>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app.business_card_signed_url}
              alt="명함"
              className="w-full rounded-lg border border-gray-200"
            />
          </section>
        )}
      </div>
    </Modal>
  );
}

function SubmissionDetailModal({
  sub,
  onClose,
}: {
  sub: Submission;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={sub.formTitle} subtitle={formatKST(sub.submittedAt)}>
      <div className="space-y-3">
        {Object.entries(sub.data).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium uppercase">{key}</span>
            <span className="text-sm text-gray-900 mt-0.5">
              {Array.isArray(value) ? value.join(", ") : value || "-"}
            </span>
          </div>
        ))}
        {Object.entries(sub.files).length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium uppercase">첨부파일</span>
            <div className="mt-1 space-y-1">
              {Object.entries(sub.files).map(([key, path]) => (
                <a
                  key={key}
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-brand hover:underline"
                >
                  📎 {path.split("/").pop()}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0 ml-3"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="flex-1 text-gray-800">{children}</span>
    </div>
  );
}

// ============================================================
// Forms tab (기존 /api/submissions 데이터)
// ============================================================
function FormsTab({
  submissions,
  loading,
  filterSlug,
  setFilterSlug,
  onRefresh,
  onRowClick,
}: {
  submissions: Submission[];
  loading: boolean;
  filterSlug: string;
  setFilterSlug: (v: string) => void;
  onRefresh: () => void;
  onRowClick: (s: Submission) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <StatCard
          label="전체"
          count={submissions.length}
          active={filterSlug === ""}
          onClick={() => setFilterSlug("")}
          tone="primary"
        />
        {formTemplates.map((ft) => {
          const count = filterSlug === ""
            ? submissions.filter((s) => s.formSlug === ft.slug).length
            : ft.slug === filterSlug
            ? submissions.length
            : 0;
          return (
            <StatCard
              key={ft.slug}
              label={`${ft.icon} ${ft.title}`}
              count={count}
              active={filterSlug === ft.slug}
              onClick={() => setFilterSlug(filterSlug === ft.slug ? "" : ft.slug)}
            />
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">
            문의 목록 <span className="text-gray-400 font-normal">({submissions.length})</span>
          </h2>
          <button onClick={onRefresh} className="text-xs text-brand hover:underline">
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">접수된 문의가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500">
                  <Th>접수일시</Th>
                  <Th>유형</Th>
                  <Th>이름</Th>
                  <Th>연락처</Th>
                  <Th>이메일</Th>
                  <Th>파일</Th>
                  <Th>상세</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50">
                    <Td className="text-xs text-gray-500 whitespace-nowrap">
                      {formatKST(sub.submittedAt)}
                    </Td>
                    <Td>
                      <span className="text-xs bg-blue-50 text-brand px-2 py-1 rounded-full font-medium whitespace-nowrap">
                        {sub.formTitle}
                      </span>
                    </Td>
                    <Td className="font-medium text-gray-900 whitespace-nowrap">
                      {(sub.data.name as string) || "-"}
                    </Td>
                    <Td className="text-gray-600 whitespace-nowrap">
                      {sub.data.phone ? formatPhone(sub.data.phone as string) : "-"}
                    </Td>
                    <Td className="text-gray-600 whitespace-nowrap">
                      {(sub.data.email as string) || "-"}
                    </Td>
                    <Td>
                      {Object.keys(sub.files).length > 0 ? (
                        <span className="text-emerald-600 text-xs">
                          📎 {Object.keys(sub.files).length}개
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </Td>
                    <Td>
                      <button
                        onClick={() => onRowClick(sub)}
                        className="text-brand hover:underline text-xs font-semibold"
                      >
                        상세
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Settings tab — 스킨 선택기
// ============================================================
function SettingsTab() {
  const [current, setCurrent] = useState<ThemeId>("navy");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<ThemeId | null>(null);
  const [msg, setMsg] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/theme");
      const { theme } = await res.json();
      setCurrent(theme);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function apply(theme: ThemeId) {
    if (saving || theme === current) return;
    setSaving(theme);
    setMsg("");
    try {
      const res = await fetch("/api/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "저장 실패" }));
        throw new Error(error);
      }
      setCurrent(theme);
      // 즉시 화면에 적용
      document.documentElement.setAttribute("data-theme", theme);
      setMsg("테마가 적용되었습니다. 전체 사이트에 반영되려면 페이지를 새로고침하세요.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "테마 저장에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">사이트 스킨 설정</h2>
        <p className="text-sm text-gray-500 mt-1">
          선택하신 테마가 <b>전체 사이트의 모든 방문자</b>에게 동일하게 적용됩니다.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          불러오는 중...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEMES.map((t) => {
            const isCurrent = current === t.id;
            const isSaving = saving === t.id;
            return (
              <button
                key={t.id}
                onClick={() => apply(t.id)}
                disabled={isSaving}
                className={`relative text-left bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  isCurrent
                    ? "border-brand shadow-lg"
                    : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {/* Preview swatch */}
                <div
                  className="h-28 relative"
                  style={{
                    background: `linear-gradient(135deg, ${t.preview[0]} 0%, ${t.preview[1]} 50%, ${t.preview[2]} 100%)`,
                  }}
                >
                  {isCurrent && (
                    <span className="absolute top-2 right-2 bg-white text-brand text-xs font-bold px-2 py-1 rounded-full shadow">
                      ✓ 현재
                    </span>
                  )}
                  {isSaving && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{t.name}</h3>
                    <span className="text-[10px] text-gray-400 font-mono">{t.id}</span>
                  </div>
                  <p className="text-xs text-gray-500">{t.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm">
          {msg}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Users tab — role 관리 (user / instructor / subadmin / admin)
// ============================================================
type Role = "user" | "instructor" | "subadmin" | "admin";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  provider: string | null;
  last_login_at: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<Role, string> = {
  user: "일반",
  instructor: "강사",
  subadmin: "서브관리자",
  admin: "관리자",
};
const ROLE_TONE: Record<Role, string> = {
  user: "bg-gray-100 text-gray-700 border-gray-200",
  instructor: "bg-blue-50 text-blue-700 border-blue-200",
  subadmin: "bg-orange-50 text-orange-700 border-orange-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("조회 실패");
      const data: AdminUser[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(userId: string, role: AdminUser["role"]) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      console.error(err);
      alert("저장 실패");
    } finally {
      setSavingId(null);
    }
  }

  async function changePhone(userId: string, phone: string) {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, phone: phone || null } : u)),
      );
    } catch (err) {
      console.error(err);
      alert("저장 실패");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">사용자 관리</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            <b>강사</b>는 <code className="text-brand">/teacher</code>에서 자기 세미나 CRUD ·
            <b>서브관리자</b>는 관리자 페이지와 전체 세미나 접근 (단, 관리자 승격 권한은 없음) ·
            <b>관리자</b>는 전체 권한.
          </p>
        </div>
        <button
          onClick={load}
          className="text-sm text-gray-500 hover:text-brand transition-colors"
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">불러오는 중...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-500 py-12">등록된 사용자가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <Th>이메일</Th>
                <Th>이름</Th>
                <Th>연락처</Th>
                <Th>권한</Th>
                <Th>가입일</Th>
                <Th>최근 로그인</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <Td className="font-mono text-xs text-gray-700 whitespace-nowrap">
                    {u.email}
                  </Td>
                  <Td className="whitespace-nowrap">{u.name || "-"}</Td>
                  <Td className="whitespace-nowrap">
                    <PhoneEditor
                      initial={u.phone || ""}
                      disabled={savingId === u.id}
                      onSave={(v) => changePhone(u.id, v)}
                    />
                  </Td>
                  <Td>
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value as AdminUser["role"])}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border ${ROLE_TONE[u.role]} focus:outline-none focus:ring-2 focus:ring-brand/20`}
                    >
                      {(["user", "instructor", "subadmin", "admin"] as const).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">
                    {formatKST(u.created_at)}
                  </Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">
                    {u.last_login_at ? formatKST(u.last_login_at) : "-"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PhoneEditor({
  initial,
  disabled,
  onSave,
}: {
  initial: string;
  disabled: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setValue(initial);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-gray-600 hover:text-brand underline-offset-2 hover:underline"
      >
        {initial ? formatPhone(initial) : "— 입력 —"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="010-0000-0000"
        className="w-32 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-brand"
      />
      <button
        onClick={() => {
          onSave(value);
          setEditing(false);
        }}
        disabled={disabled}
        className="text-xs text-brand hover:underline"
      >
        저장
      </button>
      <button
        onClick={() => {
          setValue(initial);
          setEditing(false);
        }}
        className="text-xs text-gray-400 hover:underline"
      >
        취소
      </button>
    </div>
  );
}
