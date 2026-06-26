export type ContestStatus = "모집중" | "마감임박" | "마감" | "예정";

export interface ContestSchedule {
  label: string;
  value: string;
}

export interface Contest {
  id: string;
  title: string;
  titleEn?: string;
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
  image?: string;
  fee?: string;
  eligible?: string;
  contact?: string;
  schedule?: ContestSchedule[];
}

export const CONTESTS: Contest[] = [
  {
    id: "contest-ibc-12th-2026-07",
    title: "제 12회 IBC 국제뷰티스트챔피언쉽 IN 2026",
    titleEn: "The 12th International Beautist Championship in 2026",
    subtitle: "▶ 추가모집 중 (6/25~6/26) · 시술 기술 경쟁을 지향함과 동시에 이를 예술 작품으로 기록·전시하기 위해 운영되는 전시형 공모전",
    category: "국제 기술 경연",
    tags: [
      "헤어아트", "메이크업", "반영구", "SMP",
      "네일아트", "속눈썹연장", "LED속눈썹연장", "속눈썹펌", "왁싱", "슈가링왁싱",
      "피부", "플래닝",
    ],
    dateDisplay: "2026년 7월 15일 (수) · 대구 중앙컨벤션센터",
    applicationDeadline: "2026년 6월 26일 (금)까지 · 추가모집",
    location: "대구 중앙컨벤션센터",
    organizer: "KBA뷰티스트총연합회 · 티엔티코리아 · 세렌태리 · 올티카(ALLTICA)",
    prize: "월드MVP챔피언 · 월드마스터 · 그랑프리 · 대상 · 금은동상",
    status: "마감임박",
    applyUrl: "/contests/contest-ibc-12th-2026-07/apply",
    image: "/contests/ibc-12th-2026.png",
    fee: "학생부 4만원~10만원 / 프로전문가부 10만원~26만원 (종목 수에 따라 상이)",
    eligible: "중·고등부·대학부(학생부) / 프로전문가부",
    contact: "사무국 010-9293-5659 · 대표회장 010-8842-5659 · 이사장 010-5588-7945",
    schedule: [
      { label: "추가모집 접수", value: "2026년 6월 25일 (목) ~ 6월 26일 (금) ★ 마감임박" },
      { label: "서류·작품 접수", value: "2026년 5월 1일 ~ 6월 19일 (금) (1차 마감)" },
      { label: "위촉식", value: "2026년 7월 15일 (수) 오후 3시 예정" },
      { label: "심사발표·시상식", value: "2026년 7월 15일 (수) 오후 5시 예정" },
      { label: "출품작 결과발표", value: "2026년 7월 21일 (화) 14:00 이후" },
      { label: "상장·트로피 발송", value: "2026년 7월 21일 (화) 14:00 이후 순차 발송" },
    ],
  },
  {
    id: "contest-alltica-national-1st-2026-06",
    title: "제1회 Alltica 전국 뷰티 기술 경연대회",
    subtitle: "헤어·피부·네일·메이크업 4개 부문 기술 경쟁",
    category: "전국 기술 경연",
    tags: ["헤어", "피부"],
    dateDisplay: "2026년 6월 28일 (일) 10:00 – 18:00",
    applicationDeadline: "2026년 6월 14일까지",
    location: "대구 EXCO 제1전시장",
    organizer: "Alltica 조직위원회",
    prize: "대상 300만원 · 금상 100만원 · 은상 50만원",
    status: "마감",
    applyUrl: "/contests/contest-alltica-national-1st-2026-06/apply",
  },
  {
    id: "contest-sugaring-championship-2026-06",
    title: "슈가링왁싱 챔피언십 2026",
    subtitle: "정확성·속도·마무리 3개 항목 종합 평가",
    category: "기술 경연",
    tags: ["슈가링왁싱", "왁싱"],
    dateDisplay: "2026년 6월 21일 (일) 13:00 – 17:00",
    applicationDeadline: "2026년 6월 7일까지",
    location: "대구 수성구 두산동 교육장 2층",
    organizer: "KBA · Alltica",
    prize: "우승 150만원 · 준우승 70만원",
    status: "마감",
    applyUrl: "/contests/contest-sugaring-championship-2026-06/apply",
  },
];

export function getActiveContests(): Contest[] {
  return CONTESTS.filter((c) => c.status === "모집중" || c.status === "마감임박");
}
