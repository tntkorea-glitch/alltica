/**
 * 2026년 5월 세미나 DB 정리 (image_url 제외)
 *  - KBA 강좌 5개: 가격, 일시표시, 커리큘럼 업데이트
 *
 * image_url 컬럼은 Supabase SQL Editor에서 먼저 실행:
 *   ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS image_url text;
 * 그 후 update-images-kba.ts 로 이미지 URL 업데이트
 *
 * 실행: npx tsx scripts/update-seminars-may2026.ts
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

const KBA_UPDATES = [
  {
    slug: "kba-sugaring-waxing-2026-05",
    date_display: "2026년 5월 11일 ~ 6월 1일 (매주 월요일) 14:00 – 16:00",
    price: 30000,
    curriculum: [
      "강좌 오리엔테이션 — 수업 방향·전체 일정·준비물 안내",
      "슈가링왁싱의 역사와 일반 왁싱과의 차이점 이해",
      "천연 슈가페이스트 실물 체험 및 주요 재료 소개",
      "Q&A · 다음 회차(직접 조제 & 기본 시술 실습) 예고",
    ],
  },
  {
    slug: "kba-led-lash-ext-2026-05",
    date_display: "2026년 5월 13일 ~ 6월 3일 (매주 수요일) 14:00 – 16:00",
    price: 30000,
    curriculum: [
      "강좌 오리엔테이션 — 수업 방향·전체 일정·준비물 안내",
      "LED 광경화 기술 원리 & 기존 글루 방식과의 차이점",
      "실습 재료 실물 확인: 광경화 접착제·UV 램프·핀셋·패드",
      "Q&A · 다음 회차(클래식 1:1 기초 부착 실습) 예고",
    ],
  },
  {
    slug: "kba-aroma-2026-05",
    date_display: "2026년 5월 14일 ~ 6월 4일 (매주 목요일) 14:00 – 16:00",
    price: 30000,
    curriculum: [
      "강좌 오리엔테이션 — 수업 방향·전체 일정·준비물 안내",
      "에센셜오일이란? 추출 원리·등급·안전 주의사항",
      "주요 오일 샘플 시향 체험 (라벤더, 티트리, 페퍼민트 등)",
      "Q&A · 다음 회차(블렌딩 레시피 개발 실습) 예고",
    ],
  },
  {
    slug: "kba-lash-perm-2026-05",
    date_display: "2026년 5월 15일 ~ 6월 5일 (매주 금요일) 14:00 – 16:00",
    price: 30000,
    curriculum: [
      "강좌 오리엔테이션 — 수업 방향·전체 일정·준비물 안내",
      "속눈썹펌 원리 & 약제 성분·안전 수칙 교육",
      "시술 도구 실물 확인: 로드 사이즈별 용도 이해",
      "Q&A · 다음 회차(로드 부착 기초 컬링 실습) 예고",
    ],
  },
  {
    slug: "kba-ion-energy-care-2026-06",
    date_display: "2026년 6월 8일 ~ 29일 (매주 월요일) 14:00 – 16:00",
    price: 30000,
    curriculum: [
      "강좌 오리엔테이션 — 수업 방향·전체 일정·준비물 안내",
      "이온화 에너지의 피부 작용 원리 개요",
      "기기 실물 확인 및 안전 수칙·주의 피부 유형 교육",
      "Q&A · 다음 회차(모공 클렌징 실습) 예고",
    ],
  },
];

async function main() {
  let updated = 0;
  for (const u of KBA_UPDATES) {
    const { slug, ...patch } = u;
    const { error } = await supabase
      .from("seminars")
      .update(patch)
      .eq("slug", slug);
    if (error) { console.error(`업데이트 실패 (${slug}):`, error.message); }
    else { updated++; console.log(`✅ ${slug}`); }
  }
  console.log(`\n완료: ${updated}/${KBA_UPDATES.length} KBA 강좌 업데이트`);

  const { count } = await supabase.from("seminars").select("*", { count: "exact", head: true });
  console.log(`📋 총 세미나: ${count}개`);
}

main().catch((e) => { console.error(e); process.exit(1); });
