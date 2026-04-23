import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { getSupabaseAdmin } from "@/lib/supabase";

type UserRole = "user" | "instructor" | "subadmin" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
  interface User {
    role?: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
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
    async jwt({ token, user, trigger }) {
      if (user?.email || (trigger === "signIn" && token.email)) {
        const email = user?.email ?? token.email;
        if (email) {
          const supabase = getSupabaseAdmin();
          const { data } = await supabase
            .from("users")
            .select("id, role")
            .eq("email", email)
            .maybeSingle();
          if (data) {
            token.id = data.id;
            token.role = (data.role as UserRole) ?? "user";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        session.user.role = token.role ?? "user";
      }
      return session;
    },
  },
});
