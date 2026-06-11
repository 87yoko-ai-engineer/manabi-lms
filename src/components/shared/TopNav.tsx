"use client";
// ============================================================
// Manabi LMS — トップナビゲーション
// ============================================================
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icons, IconProps } from "./Icons";
import { Avatar } from "./ui";
import { useApp } from "@/components/providers/AppProvider";

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
  { key: "news", href: "/", label: "お知らせ", icon: Icons.bell, badge: 2 },
];

export function TopNav() {
  const { actingUser, adminMode, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  if (!actingUser) return null;

  const items = adminMode ? ADMIN_ITEMS : STUDENT_ITEMS;
  const activeKey = adminMode
    ? pathname.startsWith("/admin/courses") ? "admin-courses"
      : pathname.startsWith("/admin/users") ? "admin-users"
      : "admin"
    : "home";

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
            <Avatar user={actingUser} size={32} />
            <div className="topnav-user-meta">
              <span className="tu-name">{actingUser.name}</span>
              <span className="tu-role">{actingUser.role === "admin" ? "管理者" : "受講者"}</span>
            </div>
          </div>
          <button className="icon-btn" title="ログアウト" onClick={logout}><Icons.logout size={19} /></button>
        </div>
      </div>
    </header>
  );
}

export function ImpersonationBanner() {
  const { viewAs, stopImpersonate } = useApp();
  if (!viewAs) return null;
  return (
    <div className="imp-banner">
      <span><Icons.users size={16} /><b>{viewAs.name}</b> として受講画面を表示中</span>
      <button onClick={stopImpersonate}>管理画面に戻る <Icons.arrowRight size={15} /></button>
    </div>
  );
}
