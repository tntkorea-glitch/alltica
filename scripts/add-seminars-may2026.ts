/**
 * 2026년 5월 신규 세미나 추가
 *  - postica 5/6(수), 5/7(목) 오전/오후 4개
 *  - KBA 서태리 이사장 문화센터 강좌 5개
 *
 * 실행: npx tsx scripts/add-seminars-may2026.ts
 * (slug 충돌 시 upsert 이므로 재실행 안전)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "..", ".env.local");
const envText = fs.readFileSync(envPath, "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const ADMIN_EMAIL = "tntkorea@tntkorea.co.kr";
const ADMIN_PHONE = "01088425659";
const LOCATION = "대구 수성구 두산동 교육장 2층";

// ─── postica 공통 내용 ────────────────────────────────────────────
const POSTICA_BASE = {
  title: "postica 인스타 자동화 마케팅 실전 세미나",
  subtitle: "매일 올리고, 매일 답하던 운영을 자동으로",
  location: LOCATION,
  instructor_name: "노태영 대표",
  instructor_sender_phone: ADMIN_PHONE,
  instructor_notify_phones: ADMIN_PHONE,
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
  ["postica-insta-2026-05-06-am", "2026년 5월 6일 (수) 10:00 – 13:00 · 오전반",  "2026-05-06T10:00:00+09:00", "2026-05-06T13:00:00+09:00"],
  ["postica-insta-2026-05-06-pm", "2026년 5월 6일 (수) 14:00 – 17:00 · 오후반",  "2026-05-06T14:00:00+09:00", "2026-05-06T17:00:00+09:00"],
  ["postica-insta-2026-05-07-am", "2026년 5월 7일 (목) 10:00 – 13:00 · 오전반",  "2026-05-07T10:00:00+09:00", "2026-05-07T13:00:00+09:00"],
  ["postica-insta-2026-05-07-pm", "2026년 5월 7일 (목) 14:00 – 17:00 · 오후반",  "2026-05-07T14:00:00+09:00", "2026-05-07T17:00:00+09:00"],
] as const;

// ─── KBA 문화센터 강좌 공통 ─────────────────────────────────────
const KBA_INSTRUCTOR = "서태리 이사장";
const KBA_TARGET = [
  "뷰티 기술을 처음 배우는 일반인",
  "미용 창업·부업을 준비 중인 분",
  "관련 자격증 취득을 목표로 하는 분",
  "현장 기술을 업그레이드하려는 뷰티 종사자",
];

// ─── KBA 문화센터 강좌 5개 ───────────────────────────────────────
const KBA_COURSES = [
  // 1. 몰리스 슈가링왁싱 — 매주 월요일 5/11~6/1
  {
    slug: "kba-sugaring-waxing-2026-05",
    title: "몰리스 슈가링왁싱 기초 과정",
    subtitle: "천연 슈가페이스트로 배우는 저자극 체모관리",
    date_display: "2026년 5월 11일 ~ 6월 1일 (매주 월요일) 14:00 – 16:00 · 총 4강",
    start_at: "2026-05-11T14:00:00+09:00",
    end_at:   "2026-06-01T16:00:00+09:00",
    price: 150000,
    summary: "설탕·레몬·물로 만드는 천연 슈가페이스트를 직접 조제하고, 부위별 체모관리 실습까지 한번에",
    description:
      "슈가링왁싱은 화학성분 없이 설탕·레몬·물만으로 만든 천연 페이스트를 사용해 피부 자극이 적고 사후 붉음증이 빠르게 가라앉는 것이 특징입니다. 직접 레시피를 조제하고 다양한 부위에 적용하는 실습 중심 4회 과정으로, 수료 후 홈케어·소규모 시술 모두 가능한 수준을 목표로 합니다. 재료비 포함.",
    curriculum: [
      "1강 | 슈가링왁싱 원리 & 재료 이해 – 성분·피부 유형별 적용 기준, 레시피 실습",
      "2강 | 기본 스트립 & 노워머 기법 – 온도 조절, 부위별 도포 방향 실습",
      "3강 | 다리·겨드랑이·비키니라인 심화 실습",
      "4강 | 위생·안전·사후관리 프로토콜 & 종합 기술 점검",
    ],
    tags: ["슈가링왁싱", "뷰티", "문화센터", "KBA"],
    status: "open" as const,
  },

  // 2. 루멘비 LED속눈썹연장 — 매주 수요일 5/13~6/3
  {
    slug: "kba-led-lash-ext-2026-05",
    title: "루멘비 LED 속눈썹연장 기초 과정",
    subtitle: "광경화 기술로 지속력 UP, 시술 시간 DOWN",
    date_display: "2026년 5월 13일 ~ 6월 3일 (매주 수요일) 14:00 – 16:00 · 총 4강",
    start_at: "2026-05-13T14:00:00+09:00",
    end_at:   "2026-06-03T16:00:00+09:00",
    price: 200000,
    summary: "루멘비 LED 광경화 접착 시스템으로 속눈썹연장의 지속력과 완성도를 동시에 높이는 실습 강좌",
    description:
      "기존 공기건조 방식보다 접착 시간이 빠르고 지속력이 뛰어난 루멘비 LED 광경화 속눈썹연장 기법을 익힙니다. 클래식 1:1 연장부터 볼륨(팬) 기법까지 단계별로 실습하며, 유분·피지 관리와 리무버 사용법까지 현장 즉시 활용 가능한 기술을 다룹니다. 실습 재료 포함.",
    curriculum: [
      "1강 | LED 광경화 시스템 이해 & 재료 세팅 – 접착제 특성, 램프 활용법",
      "2강 | 클래식 1:1 연장 기초 실습 – 언더테이프, 패드, 핀셋 잡는 법",
      "3강 | 볼륨(팬) 기법 & 혼합 스타일 연출",
      "4강 | 피지·유분 관리, 리무버 세팅, 지속력 극대화 마무리 & 종합 복습",
    ],
    tags: ["속눈썹연장", "LED", "루멘비", "뷰티", "문화센터", "KBA"],
    status: "open" as const,
  },

  // 3. 아로마교육 — 매주 목요일 5/14~6/4
  {
    slug: "kba-aroma-2026-05",
    title: "아로마테라피 실용 과정",
    subtitle: "에센셜오일 블렌딩부터 홈케어 제품 DIY까지",
    date_display: "2026년 5월 14일 ~ 6월 4일 (매주 목요일) 14:00 – 16:00 · 총 4강",
    start_at: "2026-05-14T14:00:00+09:00",
    end_at:   "2026-06-04T16:00:00+09:00",
    price: 130000,
    summary: "천연 에센셜오일 블렌딩부터 마사지 기법, 롤온·디퓨저·크림 제조까지 — 향기 치유의 모든 것",
    description:
      "18종 주요 에센셜오일의 향과 효능을 이해하고, 나만의 블렌딩 레시피를 개발합니다. 아로마 마사지 기법(목·어깨·얼굴 집중 케어)과 홈케어 DIY 제품(롤온·디퓨저 블렌드·에센셜 크림) 제작까지, 일상과 현장 모두에서 바로 활용할 수 있는 실용 아로마 과정입니다. 주요 오일 샘플 키트 제공.",
    curriculum: [
      "1강 | 에센셜오일 기초 이론 – 주요 18종 특성, 희석 농도, 주의사항",
      "2강 | 블렌딩 레시피 개발 & 향 연출 실습",
      "3강 | 아로마 마사지 기법 – 목·어깨·얼굴 집중 케어 실습",
      "4강 | 홈케어 제품 DIY – 롤온·디퓨저 블렌드·에센셜 크림 만들기",
    ],
    tags: ["아로마", "에센셜오일", "블렌딩", "뷰티", "문화센터", "KBA"],
    status: "open" as const,
  },

  // 4. 속눈썹펌 — 매주 금요일 5/15~6/5
  {
    slug: "kba-lash-perm-2026-05",
    title: "속눈썹펌 기초 과정",
    subtitle: "뷰러 없이 자연스러운 컬 — 업컬·다운컬·C컬 전 기법",
    date_display: "2026년 5월 15일 ~ 6월 5일 (매주 금요일) 14:00 – 16:00 · 총 4강",
    start_at: "2026-05-15T14:00:00+09:00",
    end_at:   "2026-06-05T16:00:00+09:00",
    price: 150000,
    summary: "저자극 약제로 자연스러운 속눈썹 컬을 연출하는 기법을 처음부터 배우는 실습 강좌",
    description:
      "속눈썹펌의 원리와 로드 선택 기준, 퍼밍 타임 조절 노하우를 단계별로 익힙니다. 냄새가 적은 저자극 약제 적용부터 업컬·다운컬·C컬 스타일별 연출, 시술 후 트러블 대처와 고객 사후관리 교육까지 현장 실무 기준으로 구성되었습니다.",
    curriculum: [
      "1강 | 속눈썹펌 원리 & 재료 이해 – 로드 사이즈 선택, 약제 작용 원리",
      "2강 | 기본 컬링 실습 – 로드 부착 & 퍼밍 타임 조절",
      "3강 | 업컬·다운컬·C컬 스타일별 심화 연출 실습",
      "4강 | 트러블 대처, 사후관리 교육 & 종합 기술 점검",
    ],
    tags: ["속눈썹펌", "뷰티", "문화센터", "KBA"],
    status: "open" as const,
  },

  // 5. 이온화 에너지 피부케어 — 매주 월요일 6/8~6/29 (플라즈마 기반, 용어 대체)
  {
    slug: "kba-ion-energy-care-2026-06",
    title: "이온화 에너지 피부케어 과정",
    subtitle: "에너지 이온화 기술로 모공 클렌징과 피부 재생을 한번에",
    date_display: "2026년 6월 8일 ~ 29일 (매주 월요일) 14:00 – 16:00 · 총 4강",
    start_at: "2026-06-08T14:00:00+09:00",
    end_at:   "2026-06-29T16:00:00+09:00",
    price: 180000,
    summary: "이온화 에너지 기술로 피부 표면 노폐물을 제거하고 피부 재생을 돕는 에스테틱 케어 실습",
    description:
      "이온화 에너지를 활용한 피부관리 기법으로, 모공 내 피지·노폐물 제거와 피부 활성화에 탁월한 효과를 냅니다. 기기 원리 이해부터 피부 타입별 적용 방법, 민감 피부 프로토콜, 고객 상담 프로세스까지 에스테틱 현장에서 바로 쓸 수 있는 테크닉을 실습 중심으로 배웁니다.",
    curriculum: [
      "1강 | 이온화 에너지 원리 이해 & 기기 조작 기초 실습",
      "2강 | 모공 클렌징 & 피지 컨트롤 케어 실습",
      "3강 | 피부 재생·활성화 케어 심화 – 피부 타입별 적용",
      "4강 | 민감 피부 프로토콜, 사후관리 & 고객 상담 프로세스 종합",
    ],
    tags: ["이온화에너지", "피부케어", "에스테틱", "문화센터", "KBA"],
    status: "upcoming" as const,
  },
];

async function main() {
  // 관리자 ID 조회
  const { data: admin } = await supabase
    .from("users")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();
  if (!admin) throw new Error("관리자 계정을 찾을 수 없습니다. seed-seminars.ts 를 먼저 실행하세요.");
  const adminId = admin.id;

  // postica 신규 4개
  const posticaRows = POSTICA_SESSIONS.map(([slug, dateDisplay, startAt, endAt]) => ({
    slug,
    date_display: dateDisplay,
    start_at: startAt,
    end_at: endAt,
    instructor_id: adminId,
    ...POSTICA_BASE,
    instructor_sender_phone: ADMIN_PHONE,
    instructor_notify_phones: ADMIN_PHONE,
  }));

  // KBA 문화센터 강좌 5개
  const kbaRows = KBA_COURSES.map((c) => ({
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    date_display: c.date_display,
    start_at: c.start_at,
    end_at: c.end_at,
    location: LOCATION,
    instructor_name: KBA_INSTRUCTOR,
    instructor_id: adminId,
    instructor_sender_phone: ADMIN_PHONE,
    instructor_notify_phones: ADMIN_PHONE,
    price: c.price,
    capacity: 8,
    summary: c.summary,
    description: c.description,
    curriculum: c.curriculum,
    target: KBA_TARGET,
    tags: c.tags,
    status: c.status,
  }));

  const allRows = [...posticaRows, ...kbaRows];

  const { error, count } = await supabase
    .from("seminars")
    .upsert(allRows, { onConflict: "slug", count: "exact" });
  if (error) throw error;

  console.log(`✅ upserted ${count} rows (attempted ${allRows.length})`);

  const { count: total } = await supabase
    .from("seminars")
    .select("*", { count: "exact", head: true });
  console.log(`📋 total seminars in DB: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
