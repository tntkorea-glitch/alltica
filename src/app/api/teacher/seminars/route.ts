import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTeacherContext } from "@/lib/teacher-auth";

export const runtime = "nodejs";

const STATUSES = ["upcoming", "open", "closed", "completed"] as const;
type Status = (typeof STATUSES)[number];

interface SeminarInput {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  dateDisplay?: string;
  startAt?: string;
  endAt?: string | null;
  location?: string;
  instructorName?: string;
  instructorSenderPhone?: string | null;
  instructorNotifyPhones?: string | null;
  price?: number;
  capacity?: number | null;
  summary?: string | null;
  description?: string | null;
  curriculum?: string[];
  target?: string[];
  tags?: string[];
  status?: Status;
}

function validate(body: SeminarInput): string | null {
  if (!body.slug || !/^[a-z0-9-]+$/.test(body.slug)) {
    return "슬러그는 영문 소문자/숫자/하이픈만 가능합니다.";
  }
  if (!body.title) return "제목은 필수입니다.";
  if (!body.dateDisplay) return "일시 표시(dateDisplay)는 필수입니다.";
  if (!body.startAt) return "시작 시각은 필수입니다.";
  if (!body.location) return "장소는 필수입니다.";
  if (!body.instructorName) return "강사명은 필수입니다.";
  if (body.status && !STATUSES.includes(body.status)) return "잘못된 상태값입니다.";
  return null;
}

export async function GET() {
  const ctx = await getTeacherContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const supabase = getSupabaseAdmin();
  let query = supabase.from("seminars").select("*").order("start_at", { ascending: true });
  if (ctx.role !== "admin") {
    query = query.eq("instructor_id", ctx.userId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getTeacherContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const body = (await request.json()) as SeminarInput;
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("seminars")
    .insert({
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle ?? null,
      date_display: body.dateDisplay,
      start_at: body.startAt,
      end_at: body.endAt ?? null,
      location: body.location,
      instructor_name: body.instructorName,
      instructor_id: ctx.userId,
      instructor_sender_phone: body.instructorSenderPhone ?? ctx.phone ?? null,
      instructor_notify_phones: body.instructorNotifyPhones ?? ctx.phone ?? null,
      price: body.price ?? 0,
      capacity: body.capacity ?? null,
      summary: body.summary ?? null,
      description: body.description ?? null,
      curriculum: body.curriculum ?? [],
      target: body.target ?? [],
      tags: body.tags ?? [],
      status: body.status ?? "upcoming",
    })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 슬러그입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
