import { NextResponse } from "next/server";
import { getJudgeAdminContext } from "@/lib/judge-auth";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

// IBC 단체접수 서식 파싱
// Row 9(0-based) = 헤더, Row 10+ = 데이터
// Col: 0=순번, 1=이름(한글), 2=상호(없을 수 있음), 5=연락처, 8=참가부문, 9=대종목, 10=세부종목
// 단체명은 헤더 영역(row 0~8) "단체 기관명" 라벨 옆에만 기재되는 경우가 많음

function isRealCompanyName(val: string): boolean {
  if (!val) return false;
  if (/^\d+층?$/.test(val)) return false; // 순수 숫자 or "4층" 같은 층수
  if (val.length <= 1) return false;
  return true;
}

function findHeaderCompany(rows: unknown[][]): string {
  const HEADER_AREA = Math.min(9, rows.length);
  for (let i = 0; i < HEADER_AREA; i++) {
    const row = rows[i] as (string | number)[];
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] ?? "").trim();
      if (cell.includes("단체") && (cell.includes("기관명") || cell.includes("기관") || cell.includes("상호"))) {
        // 같은 행에서 오른쪽 셀들 중 첫 번째 유의미한 값
        for (let k = j + 1; k < row.length; k++) {
          const val = String(row[k] ?? "").trim();
          if (isRealCompanyName(val)) return val;
        }
      }
    }
  }
  return "";
}

function parseIBCSheet(rows: unknown[][]): Array<{ name: string; phone: string; company: string; grade: string; mainCategory: string; division: string }> {
  const HEADER_ROW = 9;
  const headerCompany = findHeaderCompany(rows); // 헤더 영역에서 단체명 추출
  const results = [];

  for (let i = HEADER_ROW + 1; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    const seq = row[0];
    if (!seq || isNaN(Number(seq))) continue; // 데이터 행은 순번(숫자)으로 시작

    const name = String(row[1] ?? "").trim();
    const rawCompany = String(row[2] ?? "").trim();
    // col[2]가 유효한 단체명이 아니면(순자, 층수 등) 헤더 영역 단체명 사용
    const company = isRealCompanyName(rawCompany) ? rawCompany : headerCompany;
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
