"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatPhone } from "@/lib/phone";
import { formatPrice, type Seminar } from "@/lib/seminars";
import { Submission } from "@/lib/types";
import { formTemplates } from "@/lib/forms";
import { THEMES, ThemeId } from "@/lib/theme";
import { CONTESTS, Contest, ContestStatus } from "@/lib/contests";

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
  const [tab, setTab] = useState<"seminars" | "contests" | "seminar-mgmt" | "contest-mgmt" | "forms" | "users" | "settings">("seminars");

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

  const fetchSeminars = useCallback(async () => {
    const res = await fetch("/api/seminars");
    if (res.ok) setAllSeminars(await res.json());
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

  const [contestSubs, setContestSubs] = useState<Submission[]>([]);
  const [contestSubsLoading, setContestSubsLoading] = useState(false);

  const fetchContestSubs = useCallback(async () => {
    setContestSubsLoading(true);
    try {
      const res = await fetch("/api/submissions?formSlugPrefix=contest-");
      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin";
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data: Submission[] = await res.json();
      setContestSubs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setContestSubsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "seminars") fetchApps();
    else if (tab === "seminar-mgmt") fetchSeminars();
    else if (tab === "forms") fetchSubs();
    else if (tab === "contests") fetchContestSubs();
  }, [tab, fetchApps, fetchSubs, fetchSeminars, fetchContestSubs]);

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

  function submissionsToSheet(rows: Submission[]) {
    return rows.map((r) => {
      const d = r.data as Record<string, string | string[]>;
      const fileLinks = Object.values(r.files).join(" | ");
      const knownKeys = new Set(["name", "phone", "email", "company", "position"]);
      const extra = Object.entries(d)
        .filter(([k]) => !knownKeys.has(k))
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join(" / ");
      return {
        접수일시: formatKST(r.submittedAt),
        유형: r.formTitle,
        이름: (d.name as string) || "",
        연락처: d.phone ? formatPhone(d.phone as string) : "",
        이메일: (d.email as string) || "",
        회사: (d.company as string) || "",
        직책: (d.position as string) || "",
        기타: extra,
        파일: fileLinks,
      };
    });
  }

  function exportSubmissionsExcel() {
    if (submissions.length === 0) {
      alert("내보낼 문의 데이터가 없습니다.");
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(submissionsToSheet(submissions)),
      "전체"
    );

    const bySlug = new Map<string, Submission[]>();
    for (const s of submissions) {
      const arr = bySlug.get(s.formSlug) || [];
      arr.push(s);
      bySlug.set(s.formSlug, arr);
    }
    for (const [slug, list] of bySlug.entries()) {
      const title = list[0]?.formTitle || slug;
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(submissionsToSheet(list)),
        sanitizeSheetName(title)
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `alltica-일반문의-${today}.xlsx`);
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
            📋 세미나 신청{" "}
            <span className="ml-1 text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded">
              {apps.length}
            </span>
          </TabButton>
          <TabButton active={tab === "contests"} onClick={() => setTab("contests")}>
            🏆 대회 신청{" "}
            <span className="ml-1 text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded">
              {contestSubs.length}
            </span>
          </TabButton>
          <TabButton active={tab === "seminar-mgmt"} onClick={() => setTab("seminar-mgmt")}>
            🎓 세미나 관리{" "}
            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {allSeminars.length}
            </span>
          </TabButton>
          <TabButton active={tab === "contest-mgmt"} onClick={() => setTab("contest-mgmt")}>
            🏆 대회 관리{" "}
            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {CONTESTS.length}
            </span>
          </TabButton>
          <TabButton active={tab === "forms"} onClick={() => setTab("forms")}>
            📝 문의 관리{" "}
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
        {tab === "seminar-mgmt" && (
          <SeminarMgmtTab seminars={allSeminars} onRefresh={fetchSeminars} />
        )}
        {tab === "contest-mgmt" && <ContestMgmtTab />}
        {tab === "contests" && (
          <ContestsApplyTab
            submissions={contestSubs}
            loading={contestSubsLoading}
            onRefresh={fetchContestSubs}
          />
        )}
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
            onExport={exportSubmissionsExcel}
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
  onExport,
  onRowClick,
}: {
  submissions: Submission[];
  loading: boolean;
  filterSlug: string;
  setFilterSlug: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
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
          <div className="flex items-center gap-3">
            <button
              onClick={onExport}
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md font-semibold transition-colors"
            >
              📥 엑셀
            </button>
            <button onClick={onRefresh} className="text-xs text-brand hover:underline">
              새로고침
            </button>
          </div>
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
                        <div className="flex flex-col gap-0.5">
                          {Object.entries(sub.files).map(([key, path]) => {
                            const rawName = (path as string).split("/").pop()?.split("?")[0] ?? key;
                            const parts = rawName.split("_");
                            const displayName = parts.length > 1 && /^\d{10,}$/.test(parts[0]) ? parts.slice(1).join("_") : rawName;
                            return (
                              <a
                                key={key}
                                href={path as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-brand hover:underline flex items-center gap-1 whitespace-nowrap max-w-[140px] truncate"
                                title={displayName}
                              >
                                📎 {displayName}
                              </a>
                            );
                          })}
                        </div>
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
// Users tab — 시스템 권한 / KBA 등급 독립 관리
// ============================================================
type SysRole = "user" | "instructor" | "subadmin" | "admin";
type KbaGrade = "KBA이사" | "KBA지회장" | "KBA지부장" | "KBA정회원";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: SysRole;
  kba_grade: KbaGrade | null;
  provider: string | null;
  last_login_at: string | null;
  created_at: string;
  use_own_solapi: boolean | null;
  solapi_api_key: string | null;
  solapi_api_secret: string | null;
  solapi_sender: string | null;
  solapi_pf_id: string | null;
}

const SYS_ROLE_LABEL: Record<SysRole, string> = {
  user: "기본",
  instructor: "강사",
  subadmin: "서브관리자",
  admin: "관리자",
};
const SYS_ROLE_TONE: Record<SysRole, string> = {
  user: "bg-gray-100 text-gray-700 border-gray-200",
  instructor: "bg-blue-50 text-blue-700 border-blue-200",
  subadmin: "bg-orange-50 text-orange-700 border-orange-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};
const KBA_GRADE_TONE: Record<KbaGrade | "", string> = {
  "": "bg-gray-50 text-gray-400 border-gray-200",
  "KBA이사": "bg-rose-50 text-rose-700 border-rose-200",
  "KBA지회장": "bg-amber-50 text-amber-700 border-amber-200",
  "KBA지부장": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "KBA정회원": "bg-teal-50 text-teal-700 border-teal-200",
};

function UsersTab() {
  const { update: updateSession } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [solapiTarget, setSolapiTarget] = useState<AdminUser | null>(null);
  const [pending, setPending] = useState<Record<string, { role?: SysRole; kba_grade?: KbaGrade | null }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("조회 실패");
      const data: AdminUser[] = await res.json();
      setUsers(data);
      setPending({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setPendingRole(userId: string, role: SysRole) {
    setPending((prev) => ({ ...prev, [userId]: { ...prev[userId], role } }));
  }
  function setPendingKba(userId: string, grade: KbaGrade | null) {
    setPending((prev) => ({ ...prev, [userId]: { ...prev[userId], kba_grade: grade } }));
  }
  function hasPending(userId: string) {
    const p = pending[userId];
    return !!p && Object.keys(p).length > 0;
  }
  function getRole(u: AdminUser): SysRole {
    return pending[u.id]?.role ?? u.role;
  }
  function getKba(u: AdminUser): KbaGrade | null {
    const p = pending[u.id];
    return p && "kba_grade" in p ? (p.kba_grade ?? null) : u.kba_grade;
  }

  async function saveUser(userId: string) {
    const changes = pending[userId];
    if (!changes || !hasPending(userId)) return;
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "저장 실패");
      }
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...changes } : u));
      setPending((prev) => { const next = { ...prev }; delete next[userId]; return next; });
      await updateSession();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "저장 실패");
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

  async function deleteUser(u: AdminUser) {
    if (!confirm(`"${u.name || u.email}" 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "삭제 실패");
      }
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSolapiSaved(updated: Partial<AdminUser> & { id: string }) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setSolapiTarget((prev) => (prev ? { ...prev, ...updated } : null));
  }

  const noPhoneCount = users.filter((u) => !u.phone).length;
  const noNameCount = users.filter((u) => !u.name).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">사용자 관리</h2>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            <b>시스템 권한</b> — 기본: 일반 회원 · 강사: 세미나 CRUD · 서브관리자: 관리자 페이지 접근 · 관리자: 전체 권한<br />
            <b>KBA 등급</b> — 정회원/지부장/지회장/이사: 조직위 신청 가능 · 시스템 권한과 독립적으로 동작
            <span className="text-amber-600 ml-1">※ 변경 후 해당 회원 재로그인 필요</span>
          </p>
        </div>
        <button
          onClick={load}
          className="text-sm text-gray-500 hover:text-brand transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 회원 현황 요약 */}
      {!loading && users.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg font-bold text-brand">{users.length}</span>
            <span className="text-xs text-gray-500">명 전체</span>
          </div>
          <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-2 ${noPhoneCount > 0 ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
            <span className={`text-lg font-bold ${noPhoneCount > 0 ? "text-orange-600" : "text-emerald-600"}`}>{noPhoneCount}</span>
            <div>
              <div className={`text-xs font-semibold ${noPhoneCount > 0 ? "text-orange-700" : "text-emerald-700"}`}>연락처 미등록</div>
              {noPhoneCount > 0 && <div className="text-[10px] text-orange-500">재로그인 시 자동 안내</div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-700">{users.length - noPhoneCount}</span>
            <span className="text-xs text-gray-500">명 연락처 등록 완료</span>
          </div>
          {noNameCount > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 px-4 py-2.5 flex items-center gap-2">
              <span className="text-lg font-bold text-amber-600">{noNameCount}</span>
              <span className="text-xs text-amber-700">명 이름 미등록</span>
            </div>
          )}
        </div>
      )}

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
                <Th>시스템 권한</Th>
                <Th>KBA 등급</Th>
                <Th>{""}</Th>
                <Th>솔라피</Th>
                <Th>가입일</Th>
                <Th>최근 로그인</Th>
                <Th>{""}</Th>
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
                  {/* 시스템 권한 — pending */}
                  <Td>
                    <select
                      value={getRole(u)}
                      disabled={savingId === u.id}
                      onChange={(e) => setPendingRole(u.id, e.target.value as SysRole)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border ${SYS_ROLE_TONE[getRole(u)]} focus:outline-none focus:ring-2 focus:ring-brand/20`}
                    >
                      {(["user", "instructor", "subadmin", "admin"] as const).map((r) => (
                        <option key={r} value={r}>{SYS_ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                  </Td>
                  {/* KBA 등급 — pending */}
                  <Td>
                    <select
                      value={getKba(u) ?? ""}
                      disabled={savingId === u.id}
                      onChange={(e) => setPendingKba(u.id, (e.target.value as KbaGrade) || null)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border ${KBA_GRADE_TONE[getKba(u) ?? ""]} focus:outline-none focus:ring-2 focus:ring-brand/20`}
                    >
                      <option value="">없음</option>
                      {(["KBA정회원", "KBA지부장", "KBA지회장", "KBA이사"] as const).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Td>
                  {/* 저장 버튼 */}
                  <Td>
                    {hasPending(u.id) ? (
                      <button
                        onClick={() => saveUser(u.id)}
                        disabled={savingId === u.id}
                        className="text-xs px-3 py-1 rounded-full border font-semibold bg-brand text-white border-brand hover:bg-brand-hover disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {savingId === u.id ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            저장 중
                          </span>
                        ) : "저장"}
                      </button>
                    ) : (
                      <span className="text-gray-200 text-xs">—</span>
                    )}
                  </Td>
                  <Td>
                    {u.role === "instructor" ? (
                      <button
                        onClick={() => setSolapiTarget(u)}
                        className={`text-xs px-2 py-1 rounded-full border font-semibold transition-colors ${
                          u.use_own_solapi
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {u.use_own_solapi ? "자체 API ✓" : "공용 API"}
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">
                    {formatKST(u.created_at)}
                  </Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">
                    {u.last_login_at ? formatKST(u.last_login_at) : "-"}
                  </Td>
                  <Td>
                    {u.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={deletingId === u.id || savingId === u.id}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                        title="회원 삭제"
                      >
                        {deletingId === u.id ? "삭제중…" : "삭제"}
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {solapiTarget && (
        <SolapiModal
          user={solapiTarget}
          onClose={() => setSolapiTarget(null)}
          onSaved={handleSolapiSaved}
        />
      )}
    </div>
  );
}

function SolapiModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (updated: Partial<AdminUser> & { id: string }) => void;
}) {
  const [useOwn, setUseOwn] = useState(user.use_own_solapi ?? false);
  const [apiKey, setApiKey] = useState(user.solapi_api_key ?? "");
  const [apiSecret, setApiSecret] = useState(user.solapi_api_secret ?? "");
  const [sender, setSender] = useState(user.solapi_sender ?? "");
  const [pfId, setPfId] = useState(user.solapi_pf_id ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_own_solapi: useOwn,
          solapi_api_key: apiKey,
          solapi_api_secret: apiSecret,
          solapi_sender: sender,
          solapi_pf_id: pfId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "저장 실패");
      }
      onSaved({
        id: user.id,
        use_own_solapi: useOwn,
        solapi_api_key: apiKey || null,
        solapi_api_secret: apiSecret || null,
        solapi_sender: sender || null,
        solapi_pf_id: pfId || null,
      });
      setMsg("저장되었습니다.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">솔라피 설정</h3>
            <p className="text-xs text-gray-500 mt-0.5">{user.name || user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/docs/solapi-setup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline font-semibold"
            >
              📖 설정 매뉴얼
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              &times;
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">API 선택</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {useOwn ? "강사 자체 Solapi 사용" : "회사 공용 Solapi 사용"}
              </p>
            </div>
            <button
              onClick={() => setUseOwn((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${useOwn ? "bg-brand" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useOwn ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Solapi API Key"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Solapi API Secret"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">발신번호</label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="01012345678"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                카카오 채널 pfId
                <span className="ml-1 font-normal text-gray-400">(알림톡용)</span>
              </label>
              <input
                type="text"
                value={pfId}
                onChange={(e) => setPfId(e.target.value)}
                placeholder="KA01PF..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand font-mono"
              />
            </div>
          </div>

          {msg && (
            <p className={`text-xs font-semibold ${msg === "저장되었습니다." ? "text-emerald-600" : "text-red-500"}`}>
              {msg}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-brand text-white text-sm font-bold py-2.5 rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
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
        className="flex items-center gap-1.5 group"
        title="클릭하여 수정"
      >
        {initial ? (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full group-hover:bg-emerald-100 transition-colors">
            {formatPhone(initial)}
          </span>
        ) : (
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full group-hover:bg-orange-100 transition-colors">
            미등록
          </span>
        )}
        <svg className="w-3 h-3 text-gray-400 group-hover:text-brand transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
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

// ============================================================
// SeminarMgmtTab
// ============================================================
const SEMINAR_STATUS_LABEL: Record<string, string> = {
  upcoming: "예정",
  open: "모집중",
  closed: "마감",
  completed: "완료",
};
const SEMINAR_STATUS_TONE: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
};

function SeminarMgmtTab({
  seminars,
  onRefresh,
}: {
  seminars: Seminar[];
  onRefresh: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 세미나를 삭제하시겠습니까?\n신청자 데이터는 유지됩니다.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/seminars/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "삭제 실패");
      } else {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setStatusSaving(id);
    try {
      const res = await fetch(`/api/admin/seminars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "상태 변경 실패");
      } else {
        onRefresh();
      }
    } finally {
      setStatusSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">세미나 관리</h2>
          <p className="text-xs text-gray-500 mt-0.5">총 {seminars.length}개</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-sm text-gray-500 hover:text-brand border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            새로고침
          </button>
          <a
            href="/teacher/seminars/new"
            className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-brand-hover shadow-md shadow-brand/20 transition-colors"
          >
            + 새 세미나
          </a>
        </div>
      </div>

      {seminars.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">등록된 세미나가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">세미나</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">일정</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">상태</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {seminars.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 truncate max-w-xs">{s.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.location}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell whitespace-nowrap">
                    {s.dateDisplay}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.status}
                      disabled={statusSaving === s.id}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                        SEMINAR_STATUS_TONE[s.status] ?? "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {(["upcoming", "open", "closed", "completed"] as const).map((v) => (
                        <option key={v} value={v}>{SEMINAR_STATUS_LABEL[v]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={`/teacher/seminars/${s.id}`}
                      className="text-xs font-semibold text-brand hover:underline mr-3"
                    >
                      수정
                    </a>
                    <a
                      href={`/teacher/seminars/new?from=${s.id}`}
                      className="text-xs text-violet-500 hover:text-violet-700 mr-3"
                    >
                      복제
                    </a>
                    <a
                      href={`/seminars/${s.slug}`}
                      target="_blank"
                      className="text-xs text-gray-400 hover:text-gray-700 mr-3"
                    >
                      보기
                    </a>
                    <button
                      onClick={() => handleDelete(s.id, s.title)}
                      disabled={deletingId === s.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                    >
                      {deletingId === s.id ? "삭제중…" : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ContestMgmtTab — lib/contests.ts 정적 데이터 관리
// ============================================================
const CONTEST_STATUS_LABEL: Record<ContestStatus, string> = {
  모집중: "모집중",
  마감임박: "마감임박",
  마감: "마감",
  예정: "예정",
};
const CONTEST_STATUS_TONE: Record<ContestStatus, string> = {
  모집중: "bg-emerald-50 text-emerald-700 border-emerald-200",
  마감임박: "bg-red-50 text-red-600 border-red-200",
  예정: "bg-amber-50 text-amber-700 border-amber-200",
  마감: "bg-gray-100 text-gray-500 border-gray-200",
};

function ContestMgmtTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">대회 관리</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            총 {CONTESTS.length}개 · 데이터 수정: <code className="text-brand">src/lib/contests.ts</code>
          </p>
        </div>
        <a
          href="/contests"
          target="_blank"
          className="text-sm text-gray-500 hover:text-brand border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          대회 페이지 보기
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">대회명</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">일정</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">접수마감</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">상태</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">시상</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {CONTESTS.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900 truncate max-w-xs">{c.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.organizer}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell whitespace-nowrap">
                  {c.dateDisplay}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell whitespace-nowrap">
                  {c.applicationDeadline}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={CONTEST_STATUS_TONE[c.status]}>
                    {CONTEST_STATUS_LABEL[c.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                  {c.prize.split(" · ")[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ============================================================
// ContestsApplyTab — 대회 신청자 관리
// ============================================================
const CONTEST_TYPE_LABEL: Record<string, string> = {
  athlete: "🏅 선수",
  judge: "⚖️ 심사위원",
  committee: "📋 조직위",
};

function parseContestSlug(formSlug: string): { contestId: string; type: string } {
  for (const type of ["athlete", "judge", "committee"]) {
    const suffix = `-${type}`;
    if (formSlug.endsWith(suffix)) {
      return {
        contestId: formSlug.slice("contest-".length, -suffix.length),
        type,
      };
    }
  }
  return { contestId: formSlug.slice("contest-".length), type: "unknown" };
}

function ContestsApplyTab({
  submissions,
  loading,
  onRefresh,
}: {
  submissions: Submission[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = typeFilter
      ? submissions.filter((s) => s.formSlug.endsWith(`-${typeFilter}`))
      : submissions;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => {
        const d = s.data as Record<string, unknown>;
        return (
          String(d.name ?? "").toLowerCase().includes(q) ||
          String(d.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          String(d.email ?? "").toLowerCase().includes(q) ||
          s.formTitle.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [submissions, typeFilter, search]);

  const countByType = (type: string) =>
    submissions.filter((s) => s.formSlug.endsWith(`-${type}`)).length;

  function fileDisplayName(path: string): string {
    const raw = path.split("/").pop()?.split("?")[0] ?? path;
    const parts = raw.split("_");
    return parts.length > 1 && /^\d{10,}$/.test(parts[0]) ? parts.slice(1).join("_") : raw;
  }

  function subToRow(sub: Submission) {
    const d = sub.data as Record<string, unknown>;
    const { contestId, type } = parseContestSlug(sub.formSlug);
    const contest = CONTESTS.find((c) => c.id === contestId);
    const extra = Object.entries(d)
      .filter(([k]) => !["name", "phone", "email"].includes(k))
      .reduce<Record<string, string>>((acc, [k, v]) => {
        acc[k] = Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "");
        return acc;
      }, {});
    return {
      접수일시: formatKST(sub.submittedAt),
      대회: contest?.title ?? contestId,
      유형: (CONTEST_TYPE_LABEL[type] ?? type).replace(/[^\w가-힣\s]/g, "").trim(),
      이름: String(d.name ?? ""),
      연락처: d.phone ? formatPhone(d.phone as string) : "",
      이메일: String(d.email ?? ""),
      ...extra,
      파일: Object.values(sub.files).map((p) => fileDisplayName(p as string)).join(" | "),
    };
  }

  function exportExcel() {
    if (submissions.length === 0) {
      alert("내보낼 신청 데이터가 없습니다.");
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(submissions.map(subToRow)), "전체");
    for (const type of ["athlete", "judge", "committee"]) {
      const typeSubs = submissions.filter((s) => s.formSlug.endsWith(`-${type}`));
      if (typeSubs.length > 0) {
        const label = sanitizeSheetName((CONTEST_TYPE_LABEL[type] ?? type).replace(/[^\w가-힣]/g, "").trim() || type);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeSubs.map(subToRow)), label);
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `alltica-대회신청-${today}.xlsx`);
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">대회 신청 관리</h2>
          <p className="text-xs text-gray-500 mt-0.5">대회별 신청자 현황</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={submissions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            엑셀 다운로드
          </button>
          <button onClick={onRefresh} className="text-sm text-gray-500 hover:text-brand transition-colors px-3 py-1.5 rounded-lg border border-gray-200">
            새로고침
          </button>
        </div>
      </div>

      {/* 유형별 집계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-brand">{submissions.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">전체 신청</p>
        </div>
        {(["athlete", "judge", "committee"] as const).map((type) => (
          <div key={type} className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{countByType(type)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{CONTEST_TYPE_LABEL[type]}</p>
          </div>
        ))}
      </div>

      {/* 검색 + 유형 필터 */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 / 연락처 / 이메일 검색"
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand"
        />
        {[
          { val: "", label: "전체" },
          { val: "athlete", label: "🏅 선수" },
          { val: "judge", label: "⚖️ 심사위원" },
          { val: "committee", label: "📋 조직위" },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              typeFilter === val ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 신청 목록 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">
            신청 목록{" "}
            <span className="text-gray-400 font-normal">
              ({filtered.length}{filtered.length !== submissions.length ? ` / ${submissions.length}` : ""})
            </span>
          </h3>
        </div>
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-3xl mb-3">🏆</div>
            <p className="text-sm text-gray-500">{submissions.length === 0 ? "신청 내역이 없습니다." : "검색 결과가 없습니다."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">접수일시</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">대회</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">연락처</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">신청항목</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">파일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((sub) => {
                  const d = sub.data as Record<string, unknown>;
                  const { contestId, type } = parseContestSlug(sub.formSlug);
                  const contest = CONTESTS.find((c) => c.id === contestId);
                  const divisions = Array.isArray(d.divisions) ? (d.divisions as string[]).join(", ") : "";
                  const specialties = Array.isArray(d.specialties) ? (d.specialties as string[]).join(", ") : "";
                  const detail = divisions || specialties || (d.desiredRole as string) || "";
                  const extraCount = Object.keys(d).filter((k) => !["name", "phone", "email"].includes(k)).length;
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatKST(sub.submittedAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap max-w-[140px] truncate" title={contest?.title ?? contestId}>
                        {contest?.title ?? contestId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold">{CONTEST_TYPE_LABEL[type] ?? type}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{String(d.name ?? "")}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{d.phone ? formatPhone(d.phone as string) : "-"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{String(d.email ?? "-")}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px]">
                        {detail ? (
                          <span title={detail}>{detail.length > 35 ? detail.slice(0, 35) + "…" : detail}</span>
                        ) : (
                          <button onClick={() => setSelectedSub(sub)} className="text-brand hover:underline">
                            {extraCount}개 항목 보기
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {Object.keys(sub.files).length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {Object.entries(sub.files).map(([key, path]) => (
                              <a
                                key={key}
                                href={path as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-brand hover:underline whitespace-nowrap max-w-[120px] truncate block"
                                title={fileDisplayName(path as string)}
                              >
                                📎 {fileDisplayName(path as string)}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedSub(sub)} className="text-xs font-semibold text-brand hover:underline whitespace-nowrap">
                          전체 보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelectedSub(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <div className="font-bold text-gray-900">{selectedSub.formTitle}</div>
                <div className="text-xs text-gray-500 mt-0.5">{formatKST(selectedSub.submittedAt)}</div>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold shrink-0 ml-4">×</button>
            </div>
            <div className="p-6 space-y-1.5">
              {Object.entries(selectedSub.data as Record<string, unknown>).map(([key, val]) => (
                <div key={key} className="flex gap-3 py-2 border-b border-gray-50 text-sm">
                  <span className="text-gray-400 w-28 shrink-0 text-xs font-medium pt-0.5">{key}</span>
                  <span className="text-gray-800 break-all flex-1">
                    {Array.isArray(val) ? (val as string[]).join(", ") : String(val ?? "-")}
                  </span>
                </div>
              ))}
              {Object.keys(selectedSub.files).length > 0 && (
                <div className="pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">첨부파일</p>
                  <div className="space-y-1.5">
                    {Object.entries(selectedSub.files).map(([key, path]) => (
                      <a
                        key={key}
                        href={path as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-brand hover:underline bg-blue-50 px-3 py-2 rounded-lg"
                      >
                        📎 {fileDisplayName(path as string)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
