import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

// contest submissions에서 대회 목록 자동 감지
// GET /api/judge/import?action=detect
// GET /api/judge/import?action=data&contest_slug=ibc-12th-2026-07
export async function GET(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const action = request.nextUrl.searchParams.get("action");
  const supabase = getSupabaseAdmin();

  // 대회 목록 감지
  if (action === "detect") {
    const { data, error } = await supabase
      .from("submissions")
      .select("form_slug, form_title")
      .like("form_slug", "contest-%")
      .order("form_slug");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // slug에서 대회 ID 추출: contest-[contest-]<id>-<type>
    const detected = new Map<string, { slug: string; title: string; counts: Record<string, number> }>();

    for (const row of data ?? []) {
      const slug = row.form_slug;
      // "contest-" prefix 제거 후 남은 것
      let rest = slug.replace(/^contest-/, "");
      // 이중 prefix 처리: "contest-ibc-..." → "ibc-..."
      if (rest.startsWith("contest-")) rest = rest.replace(/^contest-/, "");

      // 마지막 segment (-athlete, -judge, -committee) 제거 → contest_slug
      const type = rest.match(/-(athlete|judge|committee)$/)?.[1] ?? "";
      const contestSlug = rest.replace(/-(athlete|judge|committee)$/, "");
      if (!contestSlug || !type) continue;

      if (!detected.has(contestSlug)) {
        const titleBase = row.form_title.replace(/\s*[-–]\s*(선수신청|심사위원신청|조직위신청)$/, "");
        detected.set(contestSlug, { slug: contestSlug, title: titleBase, counts: {} });
      }
      const entry = detected.get(contestSlug)!;
      entry.counts[type] = (entry.counts[type] ?? 0) + 1;
    }

    return NextResponse.json(Array.from(detected.values()));
  }

  // 특정 대회의 신청 데이터 조회
  if (action === "data") {
    const contestSlug = request.nextUrl.searchParams.get("contest_slug");
    if (!contestSlug) return NextResponse.json({ error: "contest_slug 필수" }, { status: 400 });

    // 이중 prefix 모두 포함해서 조회
    const slugPatterns = [
      `contest-${contestSlug}-%`,
      `contest-contest-${contestSlug}-%`,
    ];

    const allRows: Array<{ id: string; form_slug: string; data: Record<string, unknown>; submitted_at?: string }> = [];

    for (const pattern of slugPatterns) {
      const { data } = await supabase
        .from("submissions")
        .select("id, form_slug, data, submitted_at")
        .like("form_slug", pattern)
        .order("submitted_at", { ascending: true });
      if (data) allRows.push(...data);
    }

    // 중복 제거 (id 기준)
    const seen = new Set<string>();
    const rows = allRows.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

    const athletes = rows.filter((r) => r.form_slug.endsWith("-athlete")).map((r) => {
      const d = r.data as Record<string, unknown>;
      const divisions = (d.divisions as string[]) ?? [];
      return {
        id: r.id,
        name: (d.nameKo as string) ?? (d.한글이름 as string) ?? "",
        phone: (d.phone as string) ?? (d.연락처 as string) ?? "",
        email: (d.email as string) ?? (d.이메일 as string) ?? "",
        grade: (d.grade as string) ?? "",
        company: (d.company as string) ?? (d.상호업체명 as string) ?? "",
        divisions,
        submitted_at: r.submitted_at,
      };
    });

    const judges = rows.filter((r) => r.form_slug.endsWith("-judge")).map((r) => {
      const d = r.data as Record<string, unknown>;
      const 심사종목 = Array.isArray(d.심사종목) ? d.심사종목 as string[] : [];
      return {
        id: r.id,
        name: (d.한글이름 as string) ?? "",
        phone: (d.연락처 as string) ?? "",
        email: (d.이메일 as string) ?? "",
        title: (d.직책 as string) ?? "",
        categories: 심사종목,
        career: (d.경력사항 as string) ?? "",
        submitted_at: r.submitted_at,
      };
    });

    // 종목 목록 (athlete divisions + judge 심사종목 합산, 중복제거)
    const categorySet = new Set<string>();
    athletes.forEach((a) => a.divisions.forEach((d) => categorySet.add(d)));
    judges.forEach((j) => j.categories.forEach((c) => categorySet.add(c)));

    return NextResponse.json({ athletes, judges, categories: Array.from(categorySet).sort() });
  }

  return NextResponse.json({ error: "action 필수 (detect | data)" }, { status: 400 });
}

// 선수 일괄 등록
// POST /api/judge/import { action: "athletes", competition_id, category_map: {divisionName: categoryId}, athletes: [{name,phone,divisions}] }
export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = await request.json();
  const { action } = body;
  const supabase = getSupabaseAdmin();

  if (action === "athletes") {
    const { category_map, athletes, fallback_category_id } = body as {
      category_map: Record<string, string>;
      fallback_category_id?: string;
      athletes: Array<{ name: string; phone: string; email: string; divisions: string[]; company?: string; grade?: string }>;
    };

    // 카테고리별 현재 최대 번호 조회
    const catIds = [...new Set([...Object.values(category_map), fallback_category_id].filter(Boolean))] as string[];
    const catCounters: Record<string, number> = {};
    for (const catId of catIds) {
      const { count } = await supabase.from("contestants").select("*", { count: "exact", head: true }).eq("category_id", catId);
      catCounters[catId] = count ?? 0;
    }

    // 기존 선수 로드 → 이름+연락처(숫자)+종목 기준 중복 체크
    const existingSet = new Set<string>();
    if (catIds.length > 0) {
      const { data: existingList } = await supabase.from("contestants").select("name, phone, category_id").in("category_id", catIds);
      for (const e of existingList ?? []) {
        existingSet.add(`${e.name}|${(e.phone ?? "").replace(/\D/g, "")}|${e.category_id}`);
      }
    }

    const inserts: Array<{ category_id: string; name: string; phone: string; email: string; display_order: number; number: number; company?: string; grade?: string }> = [];
    let skippedDup = 0;

    for (const athlete of athletes) {
      const mapped = athlete.divisions.map((d) => category_map[d]).filter(Boolean);
      const targets = mapped.length > 0 ? mapped : (fallback_category_id ? [fallback_category_id] : []);

      for (const categoryId of targets) {
        const dupKey = `${athlete.name}|${(athlete.phone ?? "").replace(/\D/g, "")}|${categoryId}`;
        if (existingSet.has(dupKey)) { skippedDup++; continue; }
        existingSet.add(dupKey);
        catCounters[categoryId] = (catCounters[categoryId] ?? 0) + 1;
        inserts.push({
          category_id: categoryId,
          name: athlete.name,
          phone: athlete.phone,
          email: athlete.email,
          company: athlete.company,
          grade: athlete.grade,
          display_order: catCounters[categoryId],
          number: catCounters[categoryId],
        });
      }
    }

    if (inserts.length === 0) return NextResponse.json({ error: `등록할 선수가 없습니다 (중복 ${skippedDup}명 제외, 종목 매핑 확인)` }, { status: 400 });

    const { data, error } = await supabase.from("contestants").insert(inserts).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: data?.length ?? 0, skipped_dup: skippedDup }, { status: 201 });
  }

  // 단체접수 엑셀 행 직접 등록 (1행 = 1종목 참가, IBC 서식)
  if (action === "excel-rows") {
    const { rows, category_map, fallback_category_id } = body as {
      rows: Array<{ name: string; phone: string; company: string; grade: string; division: string }>;
      category_map: Record<string, string>;
      fallback_category_id?: string;
    };

    // 기존 선수 로드 → 중복 체크
    const targetCatIds = [...new Set([...Object.values(category_map), fallback_category_id].filter(Boolean))] as string[];
    const existingSetExcel = new Set<string>();
    if (targetCatIds.length > 0) {
      const { data: existingList } = await supabase.from("contestants").select("name, phone, category_id").in("category_id", targetCatIds);
      for (const e of existingList ?? []) {
        existingSetExcel.add(`${e.name}|${(e.phone ?? "").replace(/\D/g, "")}|${e.category_id}`);
      }
    }

    const catCounters: Record<string, number> = {};
    const inserts: Array<{ category_id: string; name: string; phone: string; display_order: number; number: number; company?: string; grade?: string }> = [];
    let skipped = 0;
    let skippedDup = 0;

    for (const row of rows) {
      const categoryId = category_map[row.division] ?? fallback_category_id;
      if (!categoryId) { skipped++; continue; }
      const dupKey = `${row.name}|${(row.phone ?? "").replace(/\D/g, "")}|${categoryId}`;
      if (existingSetExcel.has(dupKey)) { skippedDup++; continue; }
      existingSetExcel.add(dupKey);
      if (!catCounters[categoryId]) {
        const { count } = await supabase.from("contestants").select("*", { count: "exact", head: true }).eq("category_id", categoryId);
        catCounters[categoryId] = count ?? 0;
      }
      catCounters[categoryId]++;
      inserts.push({
        category_id: categoryId,
        name: row.name,
        phone: row.phone,
        company: row.company,
        grade: row.grade,
        display_order: catCounters[categoryId],
        number: catCounters[categoryId],
      });
    }

    if (inserts.length === 0) return NextResponse.json({ error: `등록할 선수가 없습니다 (중복 ${skippedDup}명 제외)` }, { status: 400 });
    const { data, error } = await supabase.from("contestants").insert(inserts).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: data?.length ?? 0, skipped, skipped_dup: skippedDup });
  }

  if (action === "judges") {
    const { assignments } = body as {
      assignments: Array<{ email: string; category_id: string; title: string; name?: string }>;
    };

    let inserted = 0;
    const errors: string[] = [];

    for (const a of assignments) {
      const { data: user } = await supabase.from("users").select("id").eq("email", a.email).maybeSingle();
      if (!user) { errors.push(`${a.email}: 회원 없음`); continue; }

      const { error } = await supabase
        .from("judge_assignments")
        .upsert({ user_id: user.id, category_id: a.category_id, assigned_by: ctx.userId, title: a.title, judge_name: a.name ?? null }, { onConflict: "user_id,category_id" });

      if (error) errors.push(`${a.email}: ${error.message}`);
      else inserted++;
    }

    return NextResponse.json({ inserted, errors });
  }

  return NextResponse.json({ error: "action 필수 (athletes | judges)" }, { status: 400 });
}
