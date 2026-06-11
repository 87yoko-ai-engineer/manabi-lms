// ============================================================
// Manabi LMS — Auth.js 本体(Credentials Provider / AUTH-01,02,03)
// ============================================================
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

/** ERR-02: 無効化アカウント(ERR-01 と区別してメッセージを出すためのカスタムエラー) */
class InactiveAccountError extends CredentialsSignin {
  code = "inactive";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // ERR-01: アカウント存在の推測を防ぐため、メール不存在とパスワード誤りは区別しない
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        // ERR-02: 無効化アカウント
        if (!user.isActive) throw new InactiveAccountError();

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
