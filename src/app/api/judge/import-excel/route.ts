import { NextResponse } from "next/server";
import { getJudgeAdminContext } from "@/lib/judge-auth";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

// IBC 단체접수 서식 파싱
// Row 9(0-based) = 헤더, Row 10+ = 데이터
// Col: 0=순번, 1=이름(한글), 2=상호, 5=연락처, 8=참가부문, 9=대종목, 10=세부종목
function parseIBCSheet(rows: unknown[][]): Array<{ name: string; phone: string; company: string; grade: string; mainCategory: string; division: string }> {
  const HEADER_ROW = 9;
  const results = [];

  for (let i = HEADER_ROW + 1; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    const seq = row[0];
    if (!seq || isNaN(Number(seq))) continue; // 데이터 행은 순번(숫자)으로 시작

    const name = String(row[1] ?? "").trim();
    const company = String(row[2] ?? "").trim();
    const phone = String(row[5] ?? "").trim();
    const grade = String(row[8] ?? "").trim();
    const mainCategory = String(row[9] ?? "").trim();
    const division = String(row[10] ?? "").trim();

    if (!name || !division) continue;
    results.push({ name, phone, company, grade, mainCategory, division });
  }
  return results;
}

// GET /api/judge/import-excel → data-file/*.xlsx 읽어서 반환
export async function GET() {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const dataDir = path.join(process.cwd(), "data-file");
  if (!fs.existsSync(dataDir)) return NextResponse.json({ files: [] });

  const xlsxFiles = fs.readdirSync(dataDir).filter((f) => /\.(xlsx|xls)$/i.test(f));
  if (xlsxFiles.length === 0) return NextResponse.json({ files: [] });

  const files: Array<{ filename: string; rows: ReturnType<typeof parseIBCSheet>; divisions: string[] }> = [];

  for (const filename of xlsxFiles) {
    try {
      const wb = XLSX.readFile(path.join(dataDir, filename));
      const sheetName = wb.SheetNames.find((n) => n.includes("선수")) ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { defval: "", header: 1 });
      const rows = parseIBCSheet(rawRows);
      const divisions = [...new Set(rows.map((r) => r.division))].sort();
      files.push({ filename, rows, divisions });
    } catch (e) {
      console.error(`[import-excel] 파싱 실패: ${filename}`, e);
    }
  }

  return NextResponse.json({ files });
}
