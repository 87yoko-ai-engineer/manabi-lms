// ============================================================
// Manabi LMS — 認証済みエリアの共通シェル(Server Component)
// セッションとなりすまし状態をサーバーで解決してクロームを描画する。
// ============================================================
import { redirect } from "next/navigation";
import { getActingUser } from "@/lib/dal";
import { TopNav } from "@/components/shared/TopNav";
import { ImpersonationBanner } from "@/components/shared/ImpersonationBanner";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const acting = await getActingUser();
  if (!acting) redirect("/login"); // middlewareが基本防御。ここは二重チェック

  const { sessionUser, actingUser, impersonating } = acting;
  const adminMode = sessionUser.role === "admin" && !impersonating;

  return (
    <div className="app" data-admin={adminMode ? "1" : "0"}>
      <TopNav user={actingUser} adminMode={adminMode} />
      {impersonating && <ImpersonationBanner name={actingUser.name} />}
      <div className="app-body">{children}</div>
      <footer className="app-foot">
        <span>Manabi LMS — ポートフォリオ用デモ</span>
        <span>Next.js · PostgreSQL · Prisma · Auth.js</span>
      </footer>
    </div>
  );
}
