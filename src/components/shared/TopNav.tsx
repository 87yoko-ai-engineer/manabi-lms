"use client";
// ============================================================
// Manabi LMS — トップナビゲーション
// モバイル(720px以下)ではナビをハンバーガーメニューに切り替える。
// UX-4: ナビは本物のリンク(<Link>)にする。「新しいタブで開く」「URLコピー」
// などブラウザ標準の操作を可能にし、遷移中のスピナーは useLinkStatus で出す。
// 未保存変更の離脱確認は unsaved.ts のクリック捕捉(a[href])が担う。
// ============================================================
import React from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icons, IconProps } from "./Icons";
import { Avatar } from "./ui";
import type { UiUser } from "@/lib/types";
import { NEWS_COUNT } from "@/lib/news";

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

/**
 * 親の<Link>が遷移中ならアイコンの代わりにスピナーを表示する。
 * useLinkStatus はリンクごとに独立した pending を返すため、
 * 「クリックされたリンクだけ」がスピナーになる。
 */
function NavIcon({ icon, spinnerStyle }: { icon: React.ReactNode; spinnerStyle?: React.CSSProperties }) {
  const { pending } = useLinkStatus();
  return pending ? <span className="spinner" style={{ width: 18, height: 18, ...spinnerStyle }} /> : <>{icon}</>;
}

export function TopNav({ user, adminMode }: { user: UiUser; adminMode: boolean }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const items = adminMode ? ADMIN_ITEMS : STUDENT_ITEMS;
  const activeKey = adminMode
    ? pathname.startsWith("/admin/courses") ? "admin-courses"
      : pathname.startsWith("/admin/users") ? "admin-users"
      : "admin"
    : pathname.startsWith("/news") ? "news" : "home";

  function renderItems(extraClass: string) {
    return items.map((it) => (
      <Link key={it.key} href={it.href}
        className={extraClass + (activeKey === it.key ? " is-active" : "")}
        onClick={() => setMenuOpen(false)}>
        <NavIcon icon={<it.icon size={20} />} />
        <span>{it.label}</span>
        {it.badge && <span className="nav-badge">{it.badge}</span>}
      </Link>
    ));
  }

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link className="brand" href={adminMode ? "/admin" : "/"}>
          <span className="brand-mark">
            <NavIcon icon={<Icons.layers size={20} />} spinnerStyle={{ color: "#fff" }} />
          </span>
          <span className="brand-word">Manabi<span className="brand-dot">.</span></span>
          {adminMode && <span className="brand-admin">ADMIN</span>}
        </Link>
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
