export const SCALE_LABELS = ["매우미흡", "미흡", "보통", "잘함", "매우잘함"] as const;

export type CriterionDef = {
  name: string;
  max: number;
  scale: [number, number, number, number, number];
};

function rs(min: number, max: number): [number, number, number, number, number] {
  const d = max - min;
  return [min, Math.round(min + d * 0.25), Math.round(min + d * 0.5), Math.round(min + d * 0.75), max];
}

const S10 = rs(2, 10) as [number, number, number, number, number];  // [2,4,6,8,10]
const S20 = [10, 12, 16, 18, 20] as [number, number, number, number, number];
const S30 = [10, 15, 20, 25, 30] as [number, number, number, number, number];
const S25 = [10, 14, 18, 22, 25] as [number, number, number, number, number];

type CatEntry = { 대면: CriterionDef[]; 출품: CriterionDef[] };

const DB: Record<string, CatEntry> = {
  // ── PMU / 반영구 ─────────────────────────────────────────
  pmu: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인조화미", max: 20, scale: S20 },
      { name: "난이도", max: 20, scale: S20 },
      { name: "숙련도", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "디자인", max: 20, scale: S20 },
      { name: "난이도", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "숙련도", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── SMP / 두피 ────────────────────────────────────────────
  smp: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인조화미", max: 20, scale: S20 },
      { name: "난이도", max: 20, scale: S20 },
      { name: "숙련도", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "디자인", max: 20, scale: S20 },
      { name: "난이도", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "숙련도", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 네일 공통 (살롱매니아트·스톤아트·창작아트·패디아트) ──
  네일아트공통: {
    대면: [
      { name: "디자인", max: 30, scale: rs(5, 30) as [number,number,number,number,number] },
      { name: "난이도", max: 40, scale: rs(15, 40) as [number,number,number,number,number] },
      { name: "완성도", max: 30, scale: rs(5, 30) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "디자인", max: 30, scale: rs(5, 30) as [number,number,number,number,number] },
      { name: "난이도", max: 40, scale: rs(15, 40) as [number,number,number,number,number] },
      { name: "완성도", max: 30, scale: rs(5, 30) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 선마블 ───────────────────────────────────────────
  선마블: {
    대면: [
      { name: "준비및위생", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "라운드", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "프리엣지", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "스마일라인", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "세로간격", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "가로간격", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "마무리", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "라운드", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "프리엣지", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "스마일라인", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "세로간격", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "가로간격", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 부채꼴마블 ──────────────────────────────────────
  부채꼴마블: {
    대면: [
      { name: "준비및위생", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "라운드", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "프리엣지", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "교대배열가로간격", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "세로간격", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "세로마블링", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "마무리", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "라운드", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "프리엣지", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "교대배열가로간격", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "세로간격", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "세로마블링", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 젤원톤스캅춰 ────────────────────────────────────
  젤원톤스캅춰: {
    대면: [
      { name: "준비및위생", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "쉐입", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "두께", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "C커브", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "기포", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "광택", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "하이포인트", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "마무리", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "쉐입", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "두께", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "C커브", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "기포", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "광택", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "하이포인트", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 아크릴프렌치스캅춰 ─────────────────────────────
  아크릴프렌치스캅춰: {
    대면: [
      { name: "쉐입", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "두께", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "C커브", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "기포", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "광택", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "하이포인트", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "프렌치라인", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "쉐입", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "두께", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "C커브", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "기포", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "광택", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "하이포인트", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "프렌치라인", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 케어+컬러링 ─────────────────────────────────────
  케어컬러링: {
    대면: [
      { name: "준비및위생", max: 10, scale: rs(2, 10) as [number,number,number,number,number] },
      { name: "쉐입", max: 20, scale: rs(10, 20) as [number,number,number,number,number] },
      { name: "큐티클", max: 20, scale: rs(10, 20) as [number,number,number,number,number] },
      { name: "컬러링상태", max: 30, scale: rs(10, 30) as [number,number,number,number,number] },
      { name: "완성도", max: 20, scale: rs(10, 20) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "준비및위생", max: 10, scale: rs(2, 10) as [number,number,number,number,number] },
      { name: "쉐입", max: 20, scale: rs(10, 20) as [number,number,number,number,number] },
      { name: "큐티클", max: 20, scale: rs(10, 20) as [number,number,number,number,number] },
      { name: "컬러링상태", max: 30, scale: rs(10, 30) as [number,number,number,number,number] },
      { name: "완성도", max: 20, scale: rs(10, 20) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 팁위드랩 ────────────────────────────────────────
  팁위드랩: {
    대면: [
      { name: "준비및위생", max: 10, scale: rs(2, 10) as [number,number,number,number,number] },
      { name: "쉐입", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "팁턱", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "하이포인트", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "두께", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "투명도", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "마무리", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "쉐입", max: 30, scale: rs(10, 30) as [number,number,number,number,number] },
      { name: "팁턱", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "하이포인트", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "두께", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "투명도", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
  },

  // ── 네일 실크익스텐션 ────────────────────────────────────
  실크익스텐션: {
    대면: [
      { name: "준비및위생", max: 10, scale: rs(2, 10) as [number,number,number,number,number] },
      { name: "쉐입", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "팁턱", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "하이포인트", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "두께", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "투명도", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "마무리", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
    출품: [
      { name: "쉐입", max: 30, scale: rs(10, 30) as [number,number,number,number,number] },
      { name: "C커브", max: 20, scale: rs(5, 20) as [number,number,number,number,number] },
      { name: "하이포인트", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "두께", max: 15, scale: rs(5, 15) as [number,number,number,number,number] },
      { name: "투명도", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
      { name: "길이", max: 10, scale: rs(5, 10) as [number,number,number,number,number] },
    ],
  },

  // ── 메이크업 뷰티·시대별·캐릭터 ─────────────────────────
  뷰티메이크업: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "베이스", max: 20, scale: S20 },
      { name: "색조", max: 20, scale: S20 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "완성도", max: 10, scale: S10 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "준비사항", max: 10, scale: S10 },
      { name: "베이스", max: 20, scale: S20 },
      { name: "색조", max: 20, scale: S20 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 메이크업 패션 ─────────────────────────────────────────
  패션메이크업: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "완성도및마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 메이크업 웨딩 ─────────────────────────────────────────
  웨딩메이크업: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "작품성", max: 20, scale: S20 },
      { name: "베이스", max: 20, scale: S20 },
      { name: "색조", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "완성도및마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "작품성", max: 10, scale: S10 },
      { name: "베이스", max: 20, scale: S20 },
      { name: "색조", max: 20, scale: S20 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 메이크업 아트마스크·환타지·특수분장·바디페인팅 ───────
  아트메이크업: {
    대면: [
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
    출품: [
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 메이크업 뷰티일러스트레이션 ──────────────────────────
  뷰티일러스트레이션: {
    대면: [
      { name: "창의성", max: 25, scale: S25 },
      { name: "테크닉", max: 25, scale: S25 },
      { name: "예술성", max: 25, scale: S25 },
      { name: "완성도", max: 25, scale: S25 },
    ],
    출품: [
      { name: "창의성", max: 25, scale: S25 },
      { name: "테크닉", max: 25, scale: S25 },
      { name: "예술성", max: 25, scale: S25 },
      { name: "완성도", max: 25, scale: S25 },
    ],
  },

  // ── 속눈썹 클래식·볼륨·LED ────────────────────────────────
  속눈썹연장: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인", max: 20, scale: S20 },
      { name: "숙련도", max: 10, scale: S10 },
      { name: "유지력", max: 10, scale: S10 },
      { name: "조화력", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인", max: 20, scale: S20 },
      { name: "숙련도", max: 10, scale: S10 },
      { name: "유지력", max: 10, scale: S10 },
      { name: "조화력", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
  },

  // ── 속눈썹펌 ─────────────────────────────────────────────
  속눈썹펌: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "완성도", max: 60, scale: [20, 30, 40, 50, 60] },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "테크닉", max: 30, scale: S30 },
      { name: "완성도", max: 70, scale: [20, 35, 50, 60, 70] },
    ],
  },

  // ── 왁싱 ─────────────────────────────────────────────────
  왁싱: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인", max: 20, scale: S20 },
      { name: "조화력", max: 20, scale: S20 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "디자인", max: 20, scale: S20 },
      { name: "조화력", max: 20, scale: S20 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 20, scale: S20 },
    ],
  },

  // ── 슈가링 ────────────────────────────────────────────────
  슈가링: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인", max: 10, scale: rs(2, 10) as [number,number,number,number,number] },
      { name: "조화력", max: 20, scale: S20 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 20, scale: S20 },
    ],
    출품: [
      { name: "디자인", max: 20, scale: S20 },
      { name: "조화력", max: 20, scale: S20 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 20, scale: S20 },
    ],
  },

  // ── 피부 ─────────────────────────────────────────────────
  피부: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "연결성", max: 20, scale: S20 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 10, scale: S10 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "준비성", max: 10, scale: S10 },
      { name: "연결성", max: 30, scale: S30 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 10, scale: S10 },
    ],
  },

  // ── 플래닝 (스킨·패디) ───────────────────────────────────
  플래닝: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "정확성", max: 20, scale: S20 },
      { name: "난이도", max: 40, scale: rs(15, 40) as [number,number,number,number,number] },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "정확성", max: 30, scale: S30 },
      { name: "난이도", max: 40, scale: rs(15, 40) as [number,number,number,number,number] },
      { name: "완성도", max: 30, scale: S30 },
    ],
  },

  // ── 헤어 블로드라이·롤세팅 ────────────────────────────────
  헤어스타일: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "조화미", max: 10, scale: S10 },
      { name: "완성도", max: 10, scale: S10 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 헤어 원랭스커트·펌와이딩 ────────────────────────────
  헤어커트: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "테크닉", max: 25, scale: S25 },
      { name: "예술성", max: 25, scale: S25 },
      { name: "조화미", max: 25, scale: S25 },
      { name: "완성도", max: 25, scale: S25 },
    ],
  },

  // ── 헤어 고전머리·붙임머리 (출품 전용) ──────────────────
  헤어작품: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "창의성", max: 20, scale: S20 },
      { name: "테크닉", max: 20, scale: S20 },
      { name: "예술성", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 타투 ─────────────────────────────────────────────────
  타투: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "디자인", max: 20, scale: S20 },
      { name: "난이도", max: 20, scale: S20 },
      { name: "숙련도", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "디자인", max: 20, scale: S20 },
      { name: "난이도", max: 20, scale: S20 },
      { name: "조화미", max: 20, scale: S20 },
      { name: "숙련도", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
    ],
  },

  // ── 이용(이발) ───────────────────────────────────────────
  이용: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "정확성", max: 30, scale: S30 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "테크닉", max: 30, scale: S30 },
      { name: "정확성", max: 30, scale: S30 },
      { name: "완성도", max: 25, scale: S25 },
      { name: "마무리", max: 15, scale: rs(5, 15) as [number, number, number, number, number] },
    ],
  },

  // ── 플라즈마 ─────────────────────────────────────────────
  플라즈마: {
    대면: [
      { name: "준비및위생", max: 10, scale: S10 },
      { name: "연결성", max: 20, scale: S20 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 10, scale: S10 },
      { name: "마무리", max: 10, scale: S10 },
    ],
    출품: [
      { name: "연결성", max: 20, scale: S20 },
      { name: "테크닉", max: 30, scale: S30 },
      { name: "전문성", max: 20, scale: S20 },
      { name: "완성도", max: 20, scale: S20 },
      { name: "마무리", max: 10, scale: S10 },
    ],
  },
};

// ─── 카테고리명 → DB 키 매핑 ────────────────────────────────

type MatchRule = { pattern: RegExp; key: string };

const MATCH_RULES: MatchRule[] = [
  // ── 네일 세부 ───────────────────────────────────────────
  { pattern: /속눈썹펌|눈썹펌/, key: "속눈썹펌" },
  { pattern: /클래식연장|볼륨연장|led속눈썹|led|속눈썹연장|아이래쉬/, key: "속눈썹연장" },
  { pattern: /선마블/, key: "선마블" },
  { pattern: /부채꼴마블|부채꼴/, key: "부채꼴마블" },
  { pattern: /젤원톤|젤.?원톤/, key: "젤원톤스캅춰" },
  { pattern: /아크릴프렌치|프렌치스캅/, key: "아크릴프렌치스캅춰" },
  { pattern: /케어.?컬러링|컬러링/, key: "케어컬러링" },
  { pattern: /팁위드랩|팁.?랩/, key: "팁위드랩" },
  { pattern: /실크익스텐션|실크/, key: "실크익스텐션" },
  { pattern: /살롱매니|스톤아트|창작아트|패디아트/, key: "네일아트공통" },
  // ── 메이크업 세부 ────────────────────────────────────────
  { pattern: /패션메이크업|패션/, key: "패션메이크업" },
  { pattern: /웨딩메이크업|웨딩/, key: "웨딩메이크업" },
  { pattern: /아트마스크|환타지|특수분장|바디페인팅|환상/, key: "아트메이크업" },
  { pattern: /일러스트|일러스트레이/, key: "뷰티일러스트레이션" },
  { pattern: /시대별|캐릭터메이크업|캐릭터|뷰티메이크업/, key: "뷰티메이크업" },
  // ── 플래닝 ──────────────────────────────────────────────
  { pattern: /스킨플래닝|패디플래닝|플래닝/, key: "플래닝" },
  // ── 왁싱 / 슈가링 (바디(S)/바디(W) 등 — 괄호 제거 후 매칭) ──
  { pattern: /바디s|페이스s|슈가링|sugaring/, key: "슈가링" },
  { pattern: /바디w|페이스w|바디다리|왁싱|waxing/, key: "왁싱" },
  // ── 피부 (바디관리 계열 포함) ────────────────────────────
  { pattern: /바디관리|살롱테크닉|페이스관리|근막테라피/, key: "피부" },
  // ── 반영구 PMU 세부종목 ──────────────────────────────────
  { pattern: /그라데이션|엠보|립아트|아이라인|풀조화/, key: "pmu" },
  // ── 타투 ────────────────────────────────────────────────
  { pattern: /레터링|미니타투|타투|tattoo/, key: "타투" },
  // ── 헤어 세부 (펌와이딩 오타 포함) ──────────────────────
  { pattern: /블로드라이|롤세팅|업스타일/, key: "헤어스타일" },
  { pattern: /원랭스|펌와인딩|펌와이딩|살롱헤어커트/, key: "헤어커트" },
  { pattern: /고전머리|붙임머리/, key: "헤어작품" },
  // ── 이용(이발) ───────────────────────────────────────────
  { pattern: /중상고|아이롱|하상고|투블록|이용/, key: "이용" },
  // ── 기타 ────────────────────────────────────────────────
  { pattern: /플라즈마/, key: "플라즈마" },
  // ── 상위 종목 (넓은 매칭 — 하위 매칭 실패 시 fallback) ──
  { pattern: /반영구|pmu|퍼머넌트/, key: "pmu" },
  { pattern: /smp|두피마이크로|두피문신/, key: "smp" },
  { pattern: /네일|nail/, key: "선마블" },
  { pattern: /메이크업|makeup/, key: "뷰티메이크업" },
  { pattern: /속눈썹|아이래쉬|eyelash/, key: "속눈썹연장" },
  { pattern: /왁싱|waxing/, key: "왁싱" },
  { pattern: /슈가링|sugaring/, key: "슈가링" },
  { pattern: /피부|skin/, key: "피부" },
  { pattern: /헤어|hair/, key: "헤어스타일" },
];

function matchDbKey(categoryName: string): string | null {
  const n = categoryName.toLowerCase().replace(/\s+/g, "").replace(/[()·,]/g, "");
  for (const rule of MATCH_RULES) {
    if (rule.pattern.test(n)) return rule.key;
  }
  return null;
}

export function getCriteriaForCategory(
  categoryName: string,
  type: "대면" | "출품"
): CriterionDef[] {
  const key = matchDbKey(categoryName);
  if (!key || !DB[key]) return [];
  return DB[key][type] ?? [];
}

export function getScaleForCriterion(
  categoryName: string,
  criterionName: string,
  type: "대면" | "출품"
): [number, number, number, number, number] | null {
  const criteria = getCriteriaForCategory(categoryName, type);
  const c = criteria.find((x) => x.name === criterionName);
  return c ? c.scale : null;
}

export function detectCategoryKey(categoryName: string): string | null {
  return matchDbKey(categoryName);
}
