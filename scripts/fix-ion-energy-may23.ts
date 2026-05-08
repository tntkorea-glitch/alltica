/**
 * kba-ion-energy-care: 시작일 5/23으로 변경 (3주 유지 → 종료 6/13)
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

const KO_DOW = ["일","월","화","수","목","금","토"];

async function main() {
  const { data } = await sb.from("seminars").select("start_at, end_at").eq("slug", "kba-ion-energy-care-2026-06").single();
  if (!data) { console.error("not found"); process.exit(1); }

  // 현재 시각 유지, 날짜만 변경
  const origStart = new Date(data.start_at);
  const origEnd = new Date(data.end_at);
  const duration = origEnd.getTime() - origStart.getTime(); // 3주

  const newStart = new Date(origStart);
  newStart.setFullYear(2026); newStart.setMonth(4); newStart.setDate(23); // May=4

  const newEnd = new Date(newStart.getTime() + duration);

  const startDow = KO_DOW[newStart.getDay()];
  const endM = newEnd.getMonth() + 1;
  const endD = newEnd.getDate();

  const newDisplay = `2026년 5월 23일 ~ ${endM}월 ${endD}일 (매주 ${startDow}요일) 14:00 – 16:00`;

  const { error } = await sb.from("seminars").update({
    start_at: newStart.toISOString(),
    end_at: newEnd.toISOString(),
    date_display: newDisplay,
  }).eq("slug", "kba-ion-energy-care-2026-06");

  if (error) { console.error("❌", error.message); }
  else { console.log(`✅ kba-ion-energy-care\n → ${newDisplay}`); }
}

main().catch(e => { console.error(e); process.exit(1); });
