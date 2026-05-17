import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { UserRole, KbaGrade } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      kbaGrade?: KbaGrade;
      phone?: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: UserRole;
    kbaGrade?: KbaGrade;
    phone?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    kbaGrade?: KbaGrade;
    phone?: string;
  }
}

const providers = [
  Google,
  ...(process.env.AUTH_KAKAO_ID ? [Kakao] : []),
  ...(process.env.AUTH_NAVER_ID ? [Naver] : []),
];

async function upsertUser(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  user: { email: string; name?: string | null; image?: string | null },
  provider: string
) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("users")
      .update({
        name: user.name ?? null,
        image: user.image ?? null,
        provider,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("users").insert({
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
      provider,
      role: "user",
      last_login_at: new Date().toISOString(),
    });
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const provider = account?.provider ?? "unknown";
      const supabase = getSupabaseAdmin();
      await upsertUser(supabase, { email: user.email, name: user.name, image: user.image }, provider);
      return true;
    },
    async jwt({ token, user }) {
      // user는 최초 로그인 시에만 전달 — 이후 요청은 token만 존재
      if (!user && token.id && token.role) return token;

      const email = user?.email ?? token.email;
      if (email) {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from("users")
          .select("id, role, kba_grade, phone")
          .eq("email", email)
          .maybeSingle();
        if (data) {
          token.id = data.id;
          token.role = (data.role as UserRole | undefined) ?? "user";
          token.kbaGrade = (data.kba_grade as KbaGrade | undefined) ?? undefined;
          token.phone = (data.phone as string | undefined) ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        session.user.role = token.role ?? "user";
        if (token.kbaGrade) session.user.kbaGrade = token.kbaGrade;
        if (token.phone) session.user.phone = token.phone;
      }
      return session;
    },
  },
});
