import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envText = fs.readFileSync(path.resolve(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

sb.from("seminars")
  .update({ date_display: "2026년 6월 15일 ~ 7월 6일 (매주 월요일) 14:00 – 16:00" })
  .eq("slug", "kba-ion-energy-care-2026-06")
  .then(({ error }) => console.log(error ? "❌ " + error.message : "✅ kba-ion-energy-care date_display 수정 완료"));
