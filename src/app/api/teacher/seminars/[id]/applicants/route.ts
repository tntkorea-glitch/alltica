import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTeacherContext } from "@/lib/teacher-auth";
import { BUSINESS_CARD_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

const SIGNED_URL_EXPIRY = 60 * 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTeacherContext();
  if (!ctx) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: seminar, error: sErr } = await supabase
    .from("seminars")
    .select("id, slug, title, instructor_id")
    .eq("id", id)
    .maybeSingle();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  if (!seminar) return NextResponse.json({ error: "세미나 없음" }, { status: 404 });
  if (ctx.role !== "admin" && seminar.instructor_id !== ctx.userId) {
    return NextResponse.json({ error: "본인 세미나만 조회 가능" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("applications")
    .select("*")
    .eq("seminar_slug", seminar.slug)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withSigned = await Promise.all(
    (rows ?? []).map(async (r) => {
      if (!r.business_card_url) return { ...r, business_card_signed_url: null };
      try {
        const pathOnly = r.business_card_url.replace(
          new RegExp(`^.+/${BUSINESS_CARD_BUCKET}/`),
          "",
        );
        const { data } = await supabase.storage
          .from(BUSINESS_CARD_BUCKET)
          .createSignedUrl(pathOnly, SIGNED_URL_EXPIRY);
        return { ...r, business_card_signed_url: data?.signedUrl ?? null };
      } catch {
        return { ...r, business_card_signed_url: null };
      }
    }),
  );

  return NextResponse.json({ seminar, applicants: withSigned });
}
