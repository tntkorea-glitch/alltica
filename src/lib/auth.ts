import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { UserRole, KbaGrade } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      kbaGrade?: KbaGrade;
    } & DefaultSession["user"];
  }
  interface User {
    role?: UserRole;
    kbaGrade?: KbaGrade;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    kbaGrade?: KbaGrade;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google,
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const supabase = getSupabaseAdmin();
      const { data: existing } = await supabase
        .from("users")
        .select("id, role")
        .eq("email", user.email)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("users")
          .update({
            name: user.name ?? null,
            image: user.image ?? null,
            provider: "google",
            last_login_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("users").insert({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          provider: "google",
          role: "user",
          last_login_at: new Date().toISOString(),
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      // user 객체는 최초 로그인 시에만 전달됨 — 이후 요청은 token만 존재
      // 이미 id/role이 토큰에 있으면 DB 재조회 없이 바로 반환
      if (!user && token.id && token.role) return token;

      const email = user?.email ?? token.email;
      if (email) {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from("users")
          .select("id, role, kba_grade")
          .eq("email", email)
          .maybeSingle();
        if (data) {
          token.id = data.id;
          token.role = (data.role as UserRole | undefined) ?? "user";
          token.kbaGrade = (data.kba_grade as KbaGrade | undefined) ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        session.user.role = token.role ?? "user";
        if (token.kbaGrade) session.user.kbaGrade = token.kbaGrade;
      }
      return session;
    },
  },
});
