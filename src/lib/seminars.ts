export type SeminarStatus = "upcoming" | "open" | "closed" | "completed";

export interface Seminar {
  slug: string;
  title: string;
  subtitle?: string;
  dateDisplay: string;
  startAt: string;
  endAt?: string;
  location: string;
  instructor: string;
  price: number;
  capacity?: number;
  summary: string;
  description: string;
  curriculum: string[];
  target: string[];
  tags: string[];
  status: SeminarStatus;
}

export const seminars: Seminar[] = [
  {
    slug: "beauty-marketing-2026-05",
    title: "뷰티 브랜드 마케팅 실전 세미나",
    subtitle: "초보자도 따라할 수 있는 체계적 커리큘럼",
    dateDisplay: "2026년 5월 15일 (목) 14:00 – 17:00",
    startAt: "2026-05-15T14:00:00+09:00",
    endAt: "2026-05-15T17:00:00+09:00",
    location: "대구 수성구 두산동 교육장 2층",
    instructor: "김알티카 대표",
    price: 150000,
    capacity: 30,
    summary: "SNS와 온라인 채널을 활용해 뷰티 브랜드를 빠르게 성장시키는 실전 노하우",
    description:
      "현업에서 검증된 뷰티 브랜드 마케팅 프레임워크를 3시간 압축 강의로 전달합니다. 브랜드 포지셔닝, 인스타그램·유튜브 콘텐츠 설계, 인플루언서 협업, 초기 매출 스케일업까지 — 실제 사례와 템플릿 중심으로 구성됩니다.",
    curriculum: [
      "브랜드 포지셔닝 & 타겟 페르소나 설정",
      "인스타그램·유튜브 콘텐츠 기획 프레임워크",
      "인플루언서 · 체험단 협업 실전 가이드",
      "광고 운영 최소 세팅 & 데이터 해석",
      "Q&A 및 1:1 피드백 세션",
    ],
    target: [
      "뷰티 브랜드 창업 준비 중이신 분",
      "매장을 운영하며 온라인 채널을 확장하려는 분",
      "마케팅 담당자로 뷰티 카테고리를 맡게 되신 분",
    ],
    tags: ["마케팅", "뷰티", "브랜딩"],
    status: "open",
  },
  {
    slug: "product-training-2026-05",
    title: "제품 교육 집중 과정",
    subtitle: "스킨케어·헤어케어 라인업 전반",
    dateDisplay: "2026년 5월 22일 (목) 10:00 – 16:00",
    startAt: "2026-05-22T10:00:00+09:00",
    endAt: "2026-05-22T16:00:00+09:00",
    location: "대구 수성구 두산동 교육장 2층",
    instructor: "이수진 교육팀장",
    price: 200000,
    capacity: 20,
    summary: "알티카 주요 제품의 성분·효능·시연을 한 번에 마스터하는 실습 중심 교육",
    description:
      "영업·판매·원장님 대상 제품 교육 과정입니다. 성분 해설, 피부 타입별 권장 솔루션, 판매 시 응대 스크립트, 실제 시연과 체험까지 현장 실무에 바로 적용할 수 있도록 설계되었습니다. 중식 제공.",
    curriculum: [
      "스킨케어 라인 성분 해설 & 피부 타입별 매칭",
      "헤어케어 라인 성분 해설 & 두피 타입별 매칭",
      "판매 응대 스크립트 및 클레임 대응",
      "제품 시연 실습 (실제 샘플 사용)",
      "자주 나오는 고객 질문 50선",
    ],
    target: [
      "대리점 · 매장 영업사원",
      "뷰티샵/살롱 원장님",
      "제품을 새로 입점한 파트너",
    ],
    tags: ["제품교육", "실습"],
    status: "open",
  },
  {
    slug: "sales-strategy-2026-06",
    title: "B2B 영업 전략 워크숍",
    subtitle: "대리점 확장 & 거래처 관리 노하우",
    dateDisplay: "2026년 6월 5일 (목) 14:00 – 18:00",
    startAt: "2026-06-05T14:00:00+09:00",
    endAt: "2026-06-05T18:00:00+09:00",
    location: "대구 수성구 두산동 교육장 2층",
    instructor: "박영업 이사",
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
    target: [
      "대리점 · 영업 담당자",
      "신규 거래처 확장을 준비 중인 대표님",
      "B2B 영업 조직을 리드하시는 분",
    ],
    tags: ["영업", "B2B", "워크숍"],
    status: "upcoming",
  },
  {
    slug: "digital-ads-2026-06",
    title: "디지털 광고 실전 세미나",
    subtitle: "메타·구글·네이버 광고 최소 세팅",
    dateDisplay: "2026년 6월 19일 (목) 14:00 – 17:00",
    startAt: "2026-06-19T14:00:00+09:00",
    endAt: "2026-06-19T17:00:00+09:00",
    location: "온라인 (Zoom)",
    instructor: "최디지털 강사",
    price: 100000,
    capacity: 50,
    summary: "광고 대행 없이 직접 운영할 수 있는 최소 세팅과 데이터 해석",
    description:
      "온라인 라이브 세미나입니다. 신청자에게 참여 링크와 함께 실습용 자료(광고 기획 템플릿, 지표 해석 시트)를 사전에 제공합니다. 현장 질문은 채팅으로 실시간 받습니다.",
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
    tags: ["광고", "퍼포먼스", "온라인"],
    status: "upcoming",
  },
];

export function getSeminarBySlug(slug: string): Seminar | undefined {
  return seminars.find((s) => s.slug === slug);
}

export function getOpenSeminars(): Seminar[] {
  return seminars.filter((s) => s.status === "open" || s.status === "upcoming");
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}
