import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTeacherContext } from "@/lib/teacher-auth";

export const runtime = "nodejs";

const STATUSES = ["upcoming", "open", "closed", "completed"] as const;
type Status = (typeof STATUSES)[number];

async function loadOwned(id: string) {
  const ctx = await getTeacherContext();
  if (!ctx) return { error: "권한 없음", status: 403 as const, ctx: null };

  const supabase = getSupabaseAdmin();
  const { data: seminar, error } = await supabase
    .from("seminars")
    .select("id, instructor_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return { error: error.message, status: 500 as const, ctx: null };
  if (!seminar) return { error: "세미나를 찾을 수 없습니다.", status: 404 as const, ctx: null };

  const isPriv = ctx.role === "admin" || ctx.role === "subadmin";
  if (!isPriv && seminar.instructor_id !== ctx.userId) {
    return { error: "본인이 등록한 세미나만 수정할 수 있습니다.", status: 403 as const, ctx: null };
  }
  return { ctx, status: 200 as const, error: null };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const check = await loadOwned(id);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
  if (body.dateDisplay !== undefined) patch.date_display = body.dateDisplay;
  if (body.startAt !== undefined) patch.start_at = body.startAt;
  if (body.endAt !== undefined) patch.end_at = body.endAt;
  if (body.location !== undefined) patch.location = body.location;
  if (body.instructorName !== undefined) patch.instructor_name = body.instructorName;
  if (body.instructorSenderPhone !== undefined)
    patch.instructor_sender_phone = body.instructorSenderPhone;
  if (body.instructorNotifyPhones !== undefined)
    patch.instructor_notify_phones = body.instructorNotifyPhones;
  if (body.price !== undefined) patch.price = body.price;
  if (body.capacity !== undefined) patch.capacity = body.capacity;
  if (body.summary !== undefined) patch.summary = body.summary;
  if (body.description !== undefined) patch.description = body.description;
  if (body.curriculum !== undefined) patch.curriculum = body.curriculum;
  if (body.target !== undefined) patch.target = body.target;
  if (body.tags !== undefined) patch.tags = body.tags;
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as Status)) {
      return NextResponse.json({ error: "잘못된 상태값" }, { status: 400 });
    }
    patch.status = body.status;
  }

  const { data, error } = await supabase
    .from("seminars")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const check = await loadOwned(id);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("seminars").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
