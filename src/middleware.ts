// ============================================================
// Manabi LMS — アクセス制御 (AUTH-04)
// - 未ログイン: 全保護ページ → /login へリダイレクト
// - ログイン済みで /login へ来たら ロール別ホームへ
// - 受講者(student)は /admin 以下へアクセス不可
// Prisma非依存の authConfig を使う(edgeランタイム対応)
// ============================================================
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isLogin = nextUrl.pathname === "/login";
  const isAdminArea = nextUrl.pathname.startsWith("/admin");

  if (!isLoggedIn && !isLogin) {
    return Response.redirect(new URL("/login", nextUrl));
  }
  if (isLoggedIn && isLogin) {
    return Response.redirect(new URL(role === "admin" ? "/admin" : "/", nextUrl));
  }
  if (isLoggedIn && isAdminArea && role !== "admin") {
    return Response.redirect(new URL("/", nextUrl));
  }
});

export const config = {
  // API・静的アセット・ファビコン以外に適用
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
