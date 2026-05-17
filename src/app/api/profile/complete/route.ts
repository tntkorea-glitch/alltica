import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { name, phone, businessName } = await req.json();
  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "이름과 연락처는 필수입니다." }, { status: 400 });
  }

  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  if (cleanPhone.length < 10) {
    return NextResponse.json({ error: "올바른 연락처 형식이 아닙니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      name: name.trim(),
      phone: cleanPhone,
      business_name: businessName?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id);

  if (error) {
    console.error("[profile/complete]", error);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
