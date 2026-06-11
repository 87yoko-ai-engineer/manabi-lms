"use client";
// ============================================================
// Manabi LMS — トップナビゲーション
// ============================================================
import React from "react";
import { usePathname, useRouter } from "next/navigation";
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

export function TopNav({ user, adminMode }: { user: UiUser; adminMode: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  const items = adminMode ? ADMIN_ITEMS : STUDENT_ITEMS;
  const activeKey = adminMode
    ? pathname.startsWith("/admin/courses") ? "admin-courses"
      : pathname.startsWith("/admin/users") ? "admin-users"
      : "admin"
    : pathname.startsWith("/news") ? "news" : "home";

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="brand" onClick={() => router.push(adminMode ? "/admin" : "/")}>
          <span className="brand-mark"><Icons.layers size={20} /></span>
          <span className="brand-word">Manabi<span className="brand-dot">.</span></span>
          {adminMode && <span className="brand-admin">ADMIN</span>}
        </div>
        <nav className="topnav-links">
          {items.map((it) => (
            <button key={it.key} className={"navlink" + (activeKey === it.key ? " is-active" : "")} onClick={() => router.push(it.href)}>
              <it.icon size={20} />
              <span>{it.label}</span>
              {it.badge && <span className="nav-badge">{it.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="topnav-right">
          <div className="topnav-user">
            <Avatar user={user} size={32} />
            <div className="topnav-user-meta">
              <span className="tu-name">{user.name}</span>
              <span className="tu-role">{user.role === "admin" ? "管理者" : "受講者"}</span>
            </div>
          </div>
          <button className="icon-btn" title="ログアウト" disabled={signingOut}
            onClick={() => { setSigningOut(true); signOut({ redirectTo: "/login" }); }}>
            {signingOut ? <span className="spinner" /> : <Icons.logout size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}
