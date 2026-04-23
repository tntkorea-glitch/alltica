import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

export type SeminarStatus = "upcoming" | "open" | "closed" | "completed";

export interface Seminar {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  dateDisplay: string;
  startAt: string;
  endAt?: string;
  location: string;
  instructor: string;
  instructorId?: string | null;
  instructorSenderPhone?: string | null;
  instructorNotifyPhones?: string | null;
  price: number;
  capacity?: number | null;
  summary: string;
  description: string;
  curriculum: string[];
  target: string[];
  tags: string[];
  status: SeminarStatus;
}

interface SeminarRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  date_display: string;
  start_at: string;
  end_at: string | null;
  location: string;
  instructor_name: string;
  instructor_id: string | null;
  instructor_sender_phone: string | null;
  instructor_notify_phones: string | null;
  price: number;
  capacity: number | null;
  summary: string | null;
  description: string | null;
  curriculum: unknown;
  target: unknown;
  tags: unknown;
  status: SeminarStatus;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

function mapRow(row: SeminarRow): Seminar {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    dateDisplay: row.date_display,
    startAt: row.start_at,
    endAt: row.end_at ?? undefined,
    location: row.location,
    instructor: row.instructor_name,
    instructorId: row.instructor_id,
    instructorSenderPhone: row.instructor_sender_phone,
    instructorNotifyPhones: row.instructor_notify_phones,
    price: row.price,
    capacity: row.capacity,
    summary: row.summary ?? "",
    description: row.description ?? "",
    curriculum: asStringArray(row.curriculum),
    target: asStringArray(row.target),
    tags: asStringArray(row.tags),
    status: row.status,
  };
}

export async function getAllSeminars(): Promise<Seminar[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("seminars")
    .select("*")
    .order("start_at", { ascending: true });
  if (error) {
    console.error("[seminars] getAllSeminars", error);
    return [];
  }
  return (data as SeminarRow[]).map(mapRow);
}

export async function getOpenSeminars(): Promise<Seminar[]> {
  const all = await getAllSeminars();
  return all.filter((s) => s.status === "open" || s.status === "upcoming");
}

export async function getSeminarBySlug(slug: string): Promise<Seminar | undefined> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("seminars")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return undefined;
  return mapRow(data as SeminarRow);
}

export async function getSeminarsByInstructor(instructorId: string): Promise<Seminar[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("seminars")
    .select("*")
    .eq("instructor_id", instructorId)
    .order("start_at", { ascending: true });
  if (error) {
    console.error("[seminars] getSeminarsByInstructor", error);
    return [];
  }
  return (data as SeminarRow[]).map(mapRow);
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}
