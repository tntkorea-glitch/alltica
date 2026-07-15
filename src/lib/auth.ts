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

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Google],
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
        // 병합으로 삭제된 계정(linked account)인지 확인 → primary로 리다이렉트
        const { data: linked } = await supabase
          .from("user_linked_accounts")
          .select("user_id")
          .eq("email", user.email)
          .maybeSingle();

        if (linked) {
          await supabase
            .from("users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", linked.user_id);
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
      }

      // 연락처가 같은 플레이스홀더 계정의 judge_assignments를 실계정으로 자동 이전
      // - ibc.local 임시계정 (이메일 없이 배정된 경우)
      // - provider=null 계정 (신청서 이메일로 생성된 경우 — 아직 로그인 안 한 플레이스홀더)
      const { data: realUser } = await supabase
        .from("users")
        .select("id, phone")
        .eq("email", user.email!)
        .maybeSingle();
      if (realUser?.phone) {
        const cleanPhone = realUser.phone.replace(/\D/g, "");
        if (cleanPhone.length >= 8) {
          // ibc.local 임시계정
          const { data: ibcPlaceholders } = await supabase
            .from("users")
            .select("id, email, provider")
            .like("email", `judge-${cleanPhone}%@ibc.local`)
            .neq("id", realUser.id);

          // 신청서 이메일로 생성된 플레이스홀더 (provider IS NULL = 한 번도 OAuth 로그인 안 함)
          const { data: formPlaceholders } = await supabase
            .from("users")
            .select("id, email, provider, phone")
            .is("provider", null)
            .not("email", "like", "%@ibc.local")
            .neq("id", realUser.id);
          const matchingForm = (formPlaceholders ?? []).filter(
            (u) => u.phone && u.phone.replace(/\D/g, "") === cleanPhone,
          );

          const allPlaceholders = [...(ibcPlaceholders ?? []), ...matchingForm];

          for (const p of allPlaceholders) {
            // judge_assignments: 이미 배정된 종목은 건너뜀
            const { data: jaRows } = await supabase
              .from("judge_assignments")
              .select("id, category_id")
              .eq("user_id", p.id);
            for (const ja of jaRows ?? []) {
              const { data: clash } = await supabase
                .from("judge_assignments")
                .select("id")
                .eq("user_id", realUser.id)
                .eq("category_id", ja.category_id)
                .maybeSingle();
              if (!clash) {
                await supabase
                  .from("judge_assignments")
                  .update({ user_id: realUser.id })
                  .eq("id", ja.id);
              } else {
                await supabase.from("judge_assignments").delete().eq("id", ja.id);
              }
            }
            // 연결 이메일로 보존 (다음에 같은 이메일로 로그인해도 연결)
            await supabase.from("user_linked_accounts").upsert(
              { user_id: realUser.id, email: p.email, provider: p.provider ?? "form" },
              { onConflict: "email" },
            );
            // 플레이스홀더 삭제 (배정 이전 완료 후)
            await supabase.from("users").delete().eq("id", p.id);
          }
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }: { token: any; user?: any; trigger?: string; session?: any }) {
      // Handle session.update() — merge client-supplied fields into token
      if (trigger === "update" && session) {
        if (session.phone) token.phone = session.phone;
        if (session.name) token.name = session.name;
        return token;
      }

      if (!user && token.id && token.role && token.phone !== undefined) return token;

      const email = user?.email ?? token.email;
      if (email) {
        const supabase = getSupabaseAdmin();
        let { data } = await supabase
          .from("users")
          .select("id, role, kba_grade, phone")
          .eq("email", email)
          .maybeSingle();

        // 병합된 보조 계정으로 로그인 시 primary 계정 조회
        if (!data) {
          const { data: linked } = await supabase
            .from("user_linked_accounts")
            .select("user_id")
            .eq("email", email)
            .maybeSingle();
          if (linked) {
            const { data: primary } = await supabase
              .from("users")
              .select("id, role, kba_grade, phone")
              .eq("id", linked.user_id)
              .maybeSingle();
            data = primary;
          }
        }

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
