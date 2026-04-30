import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[supabase] Missing ${name}. .env.local 에 Supabase 키를 추가하세요.`
    );
  }
  return value;
}

let adminSingleton: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminSingleton) return adminSingleton;
  adminSingleton = createClient(
    assertEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    assertEnv(SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return adminSingleton;
}

export function getSupabasePublic(): SupabaseClient {
  return createClient(
    assertEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    assertEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } }
  );
}

export const BUSINESS_CARD_BUCKET = "business-cards";
export const SUBMISSION_FILES_BUCKET = "submission-files";
