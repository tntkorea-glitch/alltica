/**
 * 전체 세미나 날짜 +7일 이동
 * 실행: npx tsx scripts/shift-seminar-dates.ts
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

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// +7일해도 요일은 그대로라 (월), (화) 등은 바꿀 필요 없음
function shiftKoreanDisplay(display: string, refYear: number): string {
  let year = refYear;
  return display.replace(/(\d{4}년\s*)?(\d{1,2})월\s*(\d{1,2})일/g, (_, yearPart, m, d) => {
    if (yearPart) year = parseInt(yearPart.replace("년", "").trim());
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    date.setDate(date.getDate() + 7);
    const ny = date.getFullYear();
    const nm = date.getMonth() + 1;
    const nd = date.getDate();
    if (yearPart) { year = ny; return `${ny}년 ${nm}월 ${nd}일`; }
    return `${nm}월 ${nd}일`;
  });
}

async function main() {
  const { data, error } = await supabase
    .from("seminars")
    .select("id, slug, start_at, end_at, date_display");
  if (error) { console.error("fetch:", error); process.exit(1); }

  let ok = 0;
  for (const s of data) {
    const refYear = new Date(s.start_at).getFullYear();
    const patch = {
      start_at: addDays(s.start_at, 7),
      end_at: s.end_at ? addDays(s.end_at, 7) : null,
      date_display: shiftKoreanDisplay(s.date_display, refYear),
    };
    const { error: e } = await supabase.from("seminars").update(patch).eq("id", s.id);
    if (e) { console.error(`❌ ${s.slug}:`, e.message); }
    else { console.log(`✅ ${s.slug}\n   ${s.date_display}\n → ${patch.date_display}`); ok++; }
  }
  console.log(`\n완료: ${ok}/${data.length}개 +7일`);
}

main().catch(e => { console.error(e); process.exit(1); });
