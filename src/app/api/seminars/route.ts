import { NextResponse } from "next/server";
import { getAllSeminars } from "@/lib/seminars";

export const runtime = "nodejs";

export async function GET() {
  const seminars = await getAllSeminars();
  return NextResponse.json(seminars);
}
