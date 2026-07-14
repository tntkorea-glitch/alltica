// IBC 국제뷰티스트챔피언쉽 공식 종목 계층 (2026 기준)
// major: 대종목 (심사위원 신청/배정 단위)
// judgeLabel: 심사위원 신청서 표시명
// subs: 세부종목 (선수 접수/경기 단위)

export interface CategoryGroup {
  major: string;
  judgeLabel: string;
  subs: string[];
}

export const CATEGORY_HIERARCHY: CategoryGroup[] = [
  { major: "SMP",       judgeLabel: "SMP",          subs: ["SMP"] },
  { major: "반영구",    judgeLabel: "PMU (반영구)",  subs: ["그라데이션(머신)", "그라데이션(수지)", "그라데이션(콤보)", "엠보기본", "엠보응용", "립아트", "아이라인", "풀조화"] },
  { major: "타투",      judgeLabel: "타투",          subs: ["레터링", "미니타투"] },
  { major: "속눈썹",    judgeLabel: "속눈썹",        subs: ["볼륨연장", "클래식연장"] },
  { major: "LED속눈썹", judgeLabel: "LED속눈썹",     subs: ["LED볼륨연장", "LED클래식연장"] },
  { major: "속눈썹펌",  judgeLabel: "속눈썹펌",      subs: ["속눈썹펌"] },
  { major: "슈가링왁싱",judgeLabel: "슈가링왁싱",    subs: ["바디(S)", "페이스(S)"] },
  { major: "왁싱",      judgeLabel: "왁싱",          subs: ["바디(W)", "페이스(W)"] },
  { major: "네일",      judgeLabel: "네일",          subs: ["살롱매니아트", "창작아트", "스톤아트", "패디아트", "젤매니큐어(선마블)", "젤매니큐어(부채꼴마블)", "아크릴프렌치스캅춰", "젤원톤스캅춰", "팁위드랩", "실크익스텐션", "습식케어+컬러링"] },
  { major: "피부",      judgeLabel: "피부",          subs: ["바디관리(다리)", "바디관리(복부)", "바디관리(등)", "바디관리(겨드랑이)", "바디관리(팔)", "살롱테크닉", "페이스관리", "근막테라피"] },
  { major: "스킨플래닝",judgeLabel: "스킨플래닝",    subs: ["스킨플래닝"] },
  { major: "패디플래닝",judgeLabel: "패디플래닝",    subs: ["패디플래닝"] },
  { major: "메이크업",  judgeLabel: "메이크업",      subs: [
    // 뷰티메이크업 계열 (자격증 과제 기반 - 웨딩/한복/내추럴/그라데이션)
    "뷰티메이크업(웨딩)", "뷰티메이크업(한복)", "뷰티메이크업(내추럴)", "뷰티메이크업(그라데이션)",
    // 기타 메이크업 종목
    "웨딩메이크업", "캐릭터메이크업", "시대별메이크업", "환타지메이크업",
    "패션메이크업", "아트마스크", "뷰티일러스트레이션", "특수분장",
  ] },
  { major: "헤어",      judgeLabel: "헤어",          subs: ["펌와인딩(9등분)", "펌와인딩(혼합형)", "원랭스(스파니엘)", "원랭스(이사도라)", "원랭스(그래듀에이션)", "원랭스(레이어드)", "살롱헤어커트", "살롱헤어커트(맨즈컷)", "드라이(인컬)", "드라이(아웃컬)", "블로드라이", "롤세팅", "업스타일", "고전머리", "붙임머리"] },
  // 이용(이발) — 이용사 국가기술자격 실기 과제 기반
  // 실기 과제: 상고형커트, 중상고형커트, 아이론웨이브, 면도 등
  { major: "이용",      judgeLabel: "이용",          subs: ["이용(중상고)", "이용(아이론(6mm))", "이용(아이론(12mm))", "이용(하상고)", "이용(투블록)"] },
  { major: "플라즈마",  judgeLabel: "플라즈마",      subs: ["플라즈마"] },
];

// 세부종목명 → 대종목명 역매핑 (동명 세부종목은 major를 포함해 구분해야 함)
export function getMajorBySubName(subName: string, hint?: string): string {
  if (hint) {
    const exact = CATEGORY_HIERARCHY.find(
      (g) => g.major === hint && g.subs.includes(subName)
    );
    if (exact) return exact.major;
  }
  const found = CATEGORY_HIERARCHY.find((g) => g.subs.includes(subName));
  return found?.major ?? subName;
}

// 대종목명으로 세부종목 목록 반환
export function getSubsByMajor(major: string): string[] {
  return CATEGORY_HIERARCHY.find((g) => g.major === major || g.judgeLabel === major)?.subs ?? [];
}

// 심사위원 신청서에서 온 종목명 → 대종목 정규화
export function normalizeMajorLabel(label: string): string {
  const found = CATEGORY_HIERARCHY.find(
    (g) => g.major === label || g.judgeLabel === label ||
           label.includes(g.major) || g.major.includes(label.split("(")[0].trim())
  );
  return found?.major ?? label;
}

// 대종목 목록 (심사위원 신청 기준)
export const JUDGE_MAJOR_CATEGORIES = CATEGORY_HIERARCHY.map((g) => g.major);
