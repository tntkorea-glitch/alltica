import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// .env.local 직접 파싱 (dotenv 의존성 없이)
const envPath = path.resolve(__dirname, "..", ".env.local");
const envText = fs.readFileSync(envPath, "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = "tntkorea@tntkorea.co.kr";
const ADMIN_PHONE = "01088425659";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const POSTICA = {
  title: "postica 인스타 자동화 마케팅 실전 세미나",
  subtitle: "매일 올리고, 매일 답하던 운영을 자동으로",
  location: "대구 수성구 두산동 교육장 2층",
  instructor_name: "노태영 대표",
  price: 10000,
  capacity: 10,
  summary: "postica로 인스타그램 콘텐츠 업로드·DM·팔로워 관리를 자동화하는 실전 노하우",
  description:
    "인스타 계정을 직접 운영하다 보면 피드 기획·업로드·DM 응대·해시태그 관리에 하루 대부분을 쓰게 됩니다. postica는 이 반복 업무를 자동화해, 진짜 중요한 마케팅 전략과 고객 대응에 집중할 수 있도록 도와줍니다.",
  curriculum: [
    "왜 지금 인스타 마케팅은 자동화가 필요한가",
    "postica 실전 시연: 피드 예약 · 캐러셀 · DM 자동응대",
    "팔로워 분석 & 타겟 해시태그 전략",
    "계정 성장 4주 루틴 플랜",
    "참가자 계정 라이브 세팅 & Q&A",
  ],
  target: [
    "매장·브랜드 인스타그램을 직접 운영 중이신 대표님",
    "1인 창업가 / 프리랜서",
    "인스타로 꾸준한 매출을 만들고 싶은 분",
  ],
  tags: ["인스타", "자동화", "postica"],
  status: "open" as const,
};

const POSTICA_SESSIONS = [
  ["postica-insta-2026-04-27", "2026년 4월 27일 (월) 14:00 – 17:00", "2026-04-27T14:00:00+09:00", "2026-04-27T17:00:00+09:00"],
  ["postica-insta-2026-04-28-am", "2026년 4월 28일 (화) 10:00 – 13:00 · 오전반", "2026-04-28T10:00:00+09:00", "2026-04-28T13:00:00+09:00"],
  ["postica-insta-2026-04-28-pm", "2026년 4월 28일 (화) 14:00 – 17:00 · 오후반", "2026-04-28T14:00:00+09:00", "2026-04-28T17:00:00+09:00"],
  ["postica-insta-2026-04-29-am", "2026년 4월 29일 (수) 10:00 – 13:00 · 오전반", "2026-04-29T10:00:00+09:00", "2026-04-29T13:00:00+09:00"],
  ["postica-insta-2026-04-29-pm", "2026년 4월 29일 (수) 14:00 – 17:00 · 오후반", "2026-04-29T14:00:00+09:00", "2026-04-29T17:00:00+09:00"],
  ["postica-insta-2026-04-30-am", "2026년 4월 30일 (목) 10:00 – 13:00 · 오전반", "2026-04-30T10:00:00+09:00", "2026-04-30T13:00:00+09:00"],
  ["postica-insta-2026-04-30-pm", "2026년 4월 30일 (목) 14:00 – 17:00 · 오후반", "2026-04-30T14:00:00+09:00", "2026-04-30T17:00:00+09:00"],
] as const;

async function main() {
  // 1) 관리자 upsert
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  let adminId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("users")
      .update({ role: "admin", phone: ADMIN_PHONE })
      .eq("id", existing.id)
      .select("id")
      .maybeSingle();
    if (error || !data) throw error ?? new Error("admin update failed");
    adminId = data.id;
  } else {
    const { data, error } = await supabase
      .from("users")
      .insert({
        email: ADMIN_EMAIL,
        name: "Alltica Admin",
        role: "admin",
        phone: ADMIN_PHONE,
      })
      .select("id")
      .maybeSingle();
    if (error || !data) throw error ?? new Error("admin insert failed");
    adminId = data.id;
  }
  console.log(`admin_uid = ${adminId}`);

  // 2) 세미나 upsert
  const rows = [
    ...POSTICA_SESSIONS.map(([slug, dateDisplay, startAt, endAt]) => ({
      slug,
      title: POSTICA.title,
      subtitle: POSTICA.subtitle,
      date_display: dateDisplay,
      start_at: startAt,
      end_at: endAt,
      location: POSTICA.location,
      instructor_name: POSTICA.instructor_name,
      instructor_id: adminId,
      instructor_sender_phone: ADMIN_PHONE,
      instructor_notify_phones: ADMIN_PHONE,
      price: POSTICA.price,
      capacity: POSTICA.capacity,
      summary: POSTICA.summary,
      description: POSTICA.description,
      curriculum: POSTICA.curriculum,
      target: POSTICA.target,
      tags: POSTICA.tags,
      status: POSTICA.status,
    })),
    {
      slug: "product-training-2026-05",
      title: "제품 교육 집중 과정",
      subtitle: "스킨케어·헤어케어 라인업 전반",
      date_display: "2026년 5월 22일 (목) 10:00 – 16:00",
      start_at: "2026-05-22T10:00:00+09:00",
      end_at: "2026-05-22T16:00:00+09:00",
      location: "대구 수성구 두산동 교육장 2층",
      instructor_name: "이수진 교육팀장",
      instructor_id: adminId,
      instructor_sender_phone: ADMIN_PHONE,
      instructor_notify_phones: ADMIN_PHONE,
      price: 200000,
      capacity: 20,
      summary: "Alltica 주요 제품의 성분·효능·시연을 한 번에 마스터하는 실습 중심 교육",
      description:
        "영업·판매·원장님 대상 제품 교육 과정입니다. 성분 해설, 피부 타입별 권장 솔루션, 판매 시 응대 스크립트, 실제 시연과 체험까지 현장 실무에 바로 적용할 수 있도록 설계되었습니다. 중식 제공.",
      curriculum: [
        "스킨케어 라인 성분 해설 & 피부 타입별 매칭",
        "헤어케어 라인 성분 해설 & 두피 타입별 매칭",
        "판매 응대 스크립트 및 클레임 대응",
        "제품 시연 실습 (실제 샘플 사용)",
        "자주 나오는 고객 질문 50선",
      ],
      target: ["대리점 · 매장 영업사원", "뷰티샵/살롱 원장님", "제품을 새로 입점한 파트너"],
      tags: ["제품교육", "실습"],
      status: "upcoming" as const,
    },
    {
      slug: "sales-strategy-2026-06",
      title: "B2B 영업 전략 워크숍",
      subtitle: "대리점 확장 & 거래처 관리 노하우",
      date_display: "2026년 6월 5일 (목) 14:00 – 18:00",
      start_at: "2026-06-05T14:00:00+09:00",
      end_at: "2026-06-05T18:00:00+09:00",
      location: "대구 수성구 두산동 교육장 2층",
      instructor_name: "박영업 이사",
      instructor_id: adminId,
      instructor_sender_phone: ADMIN_PHONE,
      instructor_notify_phones: ADMIN_PHONE,
      price: 250000,
      capacity: 15,
      summary: "대리점·거래처를 빠르게 확장하고 안정적으로 운영하는 실전 영업 프레임",
      description:
        "소규모 워크숍 형태로 진행됩니다. 참석자 상황에 맞춘 케이스 스터디와 실제 영업 시나리오 롤플레이까지 포함되며, 세미나 이후 3개월간 카카오톡 오픈채팅 멘토링이 제공됩니다.",
      curriculum: [
        "대리점 발굴 채널과 초기 컨택 방법",
        "첫 미팅 프레임워크 & 제안서 구성",
        "장기 거래처 유지를 위한 운영 루틴",
        "케이스 스터디 & 롤플레이",
        "3개월 사후 멘토링 오리엔테이션",
      ],
      target: ["대리점 · 영업 담당자", "신규 거래처 확장을 준비 중인 대표님", "B2B 영업 조직을 리드하시는 분"],
      tags: ["영업", "B2B", "워크숍"],
      status: "upcoming" as const,
    },
    {
      slug: "digital-ads-2026-06",
      title: "디지털 광고 실전 세미나",
      subtitle: "메타·구글·네이버 광고 최소 세팅",
      date_display: "2026년 6월 19일 (목) 14:00 – 17:00",
      start_at: "2026-06-19T14:00:00+09:00",
      end_at: "2026-06-19T17:00:00+09:00",
      location: "대구 수성구 두산동 교육장 2층",
      instructor_name: "최디지털 강사",
      instructor_id: adminId,
      instructor_sender_phone: ADMIN_PHONE,
      instructor_notify_phones: ADMIN_PHONE,
      price: 100000,
      capacity: 50,
      summary: "광고 대행 없이 직접 운영할 수 있는 최소 세팅과 데이터 해석",
      description:
        "오프라인 현장 세미나로 진행됩니다. 광고 기획 템플릿과 지표 해석 시트를 교재로 제공하며, 강의 중 실제 광고 계정을 함께 보면서 세팅을 따라 해볼 수 있습니다. 노트북 지참 권장.",
      curriculum: [
        "메타 광고 최소 세팅 3단계",
        "구글 GDN·검색 광고 기본기",
        "네이버 검색광고 운영 포인트",
        "지표 해석 (CPM, CTR, ROAS) & 리포팅",
        "실습 템플릿 활용 가이드",
      ],
      target: [
        "광고 대행에 의존하지 않고 직접 운영하고 싶은 분",
        "소규모 팀 / 1인 창업가",
        "광고 기본기를 빠르게 익히려는 마케터",
      ],
      tags: ["광고", "퍼포먼스", "오프라인"],
      status: "upcoming" as const,
    },
  ];

  const { error: upsertErr, count } = await supabase
    .from("seminars")
    .upsert(rows, { onConflict: "slug", count: "exact" });
  if (upsertErr) throw upsertErr;
  console.log(`upserted ${count} seminars (attempted ${rows.length})`);

  const { count: total } = await supabase
    .from("seminars")
    .select("*", { count: "exact", head: true });
  console.log(`total in seminars table: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
