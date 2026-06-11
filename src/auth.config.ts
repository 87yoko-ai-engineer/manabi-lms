// ============================================================
// Manabi LMS — Auth.js 共通設定(edge対応・Prisma非依存)
// middleware と本体(auth.ts)の両方から使う。
// ============================================================
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // ロールとIDをJWT・セッションに含める(AUTH-03)
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as "admin" | "student";
      return session;
    },
  },
  providers: [], // 本体(auth.ts)で Credentials を追加
} satisfies NextAuthConfig;
