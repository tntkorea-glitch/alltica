export type ContestStatus = "모집중" | "마감임박" | "마감" | "예정";

export interface Contest {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  dateDisplay: string;
  applicationDeadline: string;
  location: string;
  organizer: string;
  prize: string;
  status: ContestStatus;
  applyUrl: string;
}

export const CONTESTS: Contest[] = [
  {
    id: "contest-beauty-2026-06",
    title: "제1회 Alltica 전국 뷰티 기술 경연대회",
    subtitle: "헤어·피부·네일·메이크업 4개 부문 기술 경쟁",
    category: "기술 경연",
    tags: ["헤어", "피부", "네일", "메이크업"],
    dateDisplay: "2026년 6월 28일 (일) 10:00 – 18:00",
    applicationDeadline: "2026년 6월 14일까지",
    location: "대구 EXCO 제1전시장",
    organizer: "Alltica 조직위원회",
    prize: "대상 300만원 · 금상 100만원 · 은상 50만원",
    status: "모집중",
    applyUrl: "#",
  },
  {
    id: "contest-sugaring-2026-06",
    title: "슈가링왁싱 챔피언십 2026",
    subtitle: "정확성·속도·마무리 3개 항목 종합 평가",
    category: "기술 경연",
    tags: ["슈가링왁싱", "왁싱"],
    dateDisplay: "2026년 6월 21일 (일) 13:00 – 17:00",
    applicationDeadline: "2026년 6월 7일까지",
    location: "대구 수성구 두산동 교육장 2층",
    organizer: "KBA · Alltica",
    prize: "우승 150만원 · 준우승 70만원",
    status: "모집중",
    applyUrl: "#",
  },
  {
    id: "contest-lash-2026-07",
    title: "K-속눈썹 연장 기술 대회",
    subtitle: "클래식·볼륨·LED 광경화 3개 부문",
    category: "기술 경연",
    tags: ["속눈썹연장", "LED", "뷰티"],
    dateDisplay: "2026년 7월 12일 (일) 10:00 – 16:00",
    applicationDeadline: "2026년 6월 28일까지",
    location: "대구 EXCO 제2전시장",
    organizer: "Alltica · 루멘비",
    prize: "대상 200만원 · 부문별 최우수상 80만원",
    status: "예정",
    applyUrl: "#",
  },
  {
    id: "contest-idea-2026-07",
    title: "K-뷰티 창업 아이디어 공모전",
    subtitle: "뷰티 테크·서비스·제품 분야 창업 아이디어 발표",
    category: "공모전",
    tags: ["창업", "아이디어", "K-뷰티"],
    dateDisplay: "2026년 7월 19일 (토) 13:00 – 17:00",
    applicationDeadline: "2026년 7월 5일까지",
    location: "온라인 + 대구 현장 발표",
    organizer: "Alltica",
    prize: "대상 500만원 · 최우수상 200만원 · 우수상 100만원",
    status: "예정",
    applyUrl: "#",
  },
];

export function getActiveContests(): Contest[] {
  return CONTESTS.filter((c) => c.status === "모집중" || c.status === "마감임박");
}
