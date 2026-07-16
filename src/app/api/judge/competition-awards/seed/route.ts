import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getJudgeAdminContext } from "@/lib/judge-auth";

export const runtime = "nodejs";

const PRO_PRESETS = [
  { grade: "프로전문가부", award_name: "월드MVP챔피언", count: 1,    percent: null, per_major_category: true,  display_order: 0 },
  { grade: "프로전문가부", award_name: "월드마스터",   count: null, percent: 10,   per_major_category: false, display_order: 1 },
  { grade: "프로전문가부", award_name: "월드그랑프리", count: null, percent: 10,   per_major_category: false, display_order: 2 },
  { grade: "프로전문가부", award_name: "그랑프리",     count: null, percent: 20,   per_major_category: false, display_order: 3 },
  { grade: "프로전문가부", award_name: "대상",         count: null, percent: 60,   per_major_category: false, display_order: 4 },
];

const STUDENT_PRESETS = [
  { grade: "학생부", award_name: "대상", count: 1,    percent: null, per_major_category: true,  display_order: 0 },
  { grade: "학생부", award_name: "금상", count: null, percent: 40,   per_major_category: false, display_order: 1 },
  { grade: "학생부", award_name: "은상", count: null, percent: 40,   per_major_category: false, display_order: 2 },
  { grade: "학생부", award_name: "동상", count: null, percent: 20,   per_major_category: false, display_order: 3 },
];

export async function POST(request: NextRequest) {
  const ctx = await getJudgeAdminContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { competition_id, grade } = await request.json();
  if (!competition_id) return NextResponse.json({ error: "competition_id 필수" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  if (grade === "프로전문가부") {
    await supabase.from("competition_award_settings").delete()
      .eq("competition_id", competition_id).eq("grade", "프로전문가부");
  } else if (grade === "학생부") {
    await supabase.from("competition_award_settings").delete()
      .eq("competition_id", competition_id).eq("grade", "학생부");
  } else {
    await supabase.from("competition_award_settings").delete().eq("competition_id", competition_id);
  }

  const presets = [
    ...(!grade || grade === "프로전문가부" ? PRO_PRESETS : []),
    ...(!grade || grade === "학생부" ? STUDENT_PRESETS : []),
  ];

  const { data, error } = await supabase
    .from("competition_award_settings")
    .insert(presets.map((p) => ({ ...p, competition_id })))
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
