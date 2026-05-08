/**
 * 5/14~5/17 postica 세미나 → 5/25~5/28 (+11일)
 * 실행: npx tsx scripts/shift-postica-mid-may.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envText = fs.readFileSync(path.resolve(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const SLUGS = [
  "postica-insta-2026-04-27",    // 5/14(월) → 5/25(월)
  "postica-insta-2026-04-28-am", // 5/15(화) → 5/26(화)
  "postica-insta-2026-04-28-pm",
  "postica-insta-2026-04-29-am", // 5/16(수) → 5/27(수)
  "postica-insta-2026-04-29-pm",
  "postica-insta-2026-04-30-am", // 5/17(목) → 5/28(목)
  "postica-insta-2026-04-30-pm",
];

const KO_DOW = ["일","월","화","수","목","금","토"];

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function shiftDisplay(display: string, refYear: number, days: number): string {
  let year = refYear;
  // shift dates
  let result = display.replace(/(\d{4}년\s*)?(\d{1,2})월\s*(\d{1,2})일/g, (_, yearPart, m, d) => {
    if (yearPart) year = parseInt(yearPart.replace("년", "").trim());
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear(), nm = date.getMonth() + 1, nd = date.getDate();
    if (yearPart) { year = ny; return `${ny}년 ${nm}월 ${nd}일`; }
    return `${nm}월 ${nd}일`;
  });
  // update day-of-week in parens: (월) (화) etc. — recalculate from new start_at
  return result;
}

function updateDayOfWeek(display: string, newStartAt: string): string {
  const dow = KO_DOW[new Date(newStartAt).getDay()];
  return display.replace(/\(([월화수목금토일])\)/, `(${dow})`);
}

async function main() {
  const { data, error } = await sb.from("seminars").select("id, slug, start_at, end_at, date_display").in("slug", SLUGS);
  if (error) { console.error("fetch:", error); process.exit(1); }

  let ok = 0;
  for (const s of data) {
    const refYear = new Date(s.start_at).getFullYear();
    const newStartAt = addDays(s.start_at, 11);
    let newDisplay = shiftDisplay(s.date_display, refYear, 11);
    newDisplay = updateDayOfWeek(newDisplay, newStartAt);

    const patch = {
      start_at: newStartAt,
      end_at: s.end_at ? addDays(s.end_at, 11) : null,
      date_display: newDisplay,
    };
    const { error: e } = await sb.from("seminars").update(patch).eq("id", s.id);
    if (e) { console.error(`❌ ${s.slug}:`, e.message); }
    else { console.log(`✅ ${s.slug}\n   ${s.date_display}\n → ${patch.date_display}`); ok++; }
  }
  console.log(`\n완료: ${ok}/${data.length}개 → 5/25~5/28`);
}

main().catch(e => { console.error(e); process.exit(1); });
