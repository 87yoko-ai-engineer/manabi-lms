"use client";
// ============================================================
// Manabi LMS — トップナビゲーション
// モバイル(720px以下)ではナビをハンバーガーメニューに切り替える。
// ============================================================
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icons, IconProps } from "./Icons";
import { Avatar } from "./ui";
import type { UiUser } from "@/lib/types";
import { NEWS_COUNT } from "@/lib/news";
import { confirmIfUnsaved } from "@/lib/unsaved";

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: (p?: IconProps) => React.JSX.Element;
  badge?: number;
}

const ADMIN_ITEMS: NavItem[] = [
  { key: "admin", href: "/admin", label: "ダッシュボード", icon: Icons.chart },
  { key: "admin-courses", href: "/admin/courses", label: "講座管理", icon: Icons.book },
  { key: "admin-users", href: "/admin/users", label: "受講者管理", icon: Icons.users },
];
const STUDENT_ITEMS: NavItem[] = [
  { key: "home", href: "/", label: "ホーム", icon: Icons.home },
  { key: "courses", href: "/", label: "講座", icon: Icons.book },
  { key: "news", href: "/news", label: "お知らせ", icon: Icons.bell, badge: NEWS_COUNT },
];

export function TopNav({ user, adminMode }: { user: UiUser; adminMode: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);
  // ナビゲーション中のボタンにスピナーを出すための状態。
  // スピナー表示は「クリックされた かつ 遷移中」の導出値なので、遷移が終われば自然に消える(effect不要)。
  const [navPending, startNav] = React.useTransition();
  const [clickedKey, setClickedKey] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  function go(key: string, href: string) {
    // 未保存のカリキュラム変更などがあれば、移動前に確認する(押し忘れた変更が静かに消えるのを防ぐ)
    if (!confirmIfUnsaved()) return;
    setClickedKey(key);
    setMenuOpen(false);
    startNav(() => router.push(href));
  }

  const items = adminMode ? ADMIN_ITEMS : STUDENT_ITEMS;
  const activeKey = adminMode
    ? pathname.startsWith("/admin/courses") ? "admin-courses"
      : pathname.startsWith("/admin/users") ? "admin-users"
      : "admin"
    : pathname.startsWith("/news") ? "news" : "home";

  function renderItems(extraClass: string) {
    return items.map((it) => {
      const busy = clickedKey === it.key && navPending;
      return (
        <button key={it.key} className={extraClass + (activeKey === it.key ? " is-active" : "")} disabled={navPending} onClick={() => go(it.key, it.href)}>
          {busy ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <it.icon size={20} />}
          <span>{it.label}</span>
          {it.badge && <span className="nav-badge">{it.badge}</span>}
        </button>
      );
    });
  }

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="brand" onClick={() => go("brand", adminMode ? "/admin" : "/")}>
          <span className="brand-mark">
            {clickedKey === "brand" && navPending ? <span className="spinner" style={{ color: "#fff" }} /> : <Icons.layers size={20} />}
          </span>
          <span className="brand-word">Manabi<span className="brand-dot">.</span></span>
          {adminMode && <span className="brand-admin">ADMIN</span>}
        </div>
        <nav className="topnav-links">{renderItems("navlink")}</nav>
        <div className="topnav-right">
          <div className="topnav-user">
            <Avatar user={user} size={32} />
            <div className="topnav-user-meta">
              <span className="tu-name">{user.name}</span>
              <span className="tu-role">{user.role === "admin" ? "管理者" : "受講者"}</span>
            </div>
          </div>
          <button className="icon-btn" title="ログアウト" aria-label="ログアウト" disabled={signingOut}
            onClick={() => { setSigningOut(true); signOut({ redirectTo: "/login" }); }}>
            {signingOut ? <span className="spinner" /> : <Icons.logout size={19} />}
          </button>
          <button className="icon-btn nav-burger" aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"} aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <Icons.x size={20} /> : <Icons.menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-menu">
          <div className="mobile-menu-user">
            <Avatar user={user} size={32} />
            <div>
              <div className="tu-name">{user.name}</div>
              <div className="tu-role">{user.role === "admin" ? "管理者" : "受講者"}</div>
            </div>
          </div>
          {renderItems("mobile-navlink")}
        </nav>
      )}
    </header>
  );
}
