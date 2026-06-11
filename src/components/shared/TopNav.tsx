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
  // ナビゲーション中のボタンにスピナーを出すための状態
  const [navPending, startNav] = React.useTransition();
  const [clickedKey, setClickedKey] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!navPending) setClickedKey(null); // 遷移が終わったらスピナーを消す
  }, [navPending]);

  function go(key: string, href: string) {
    setClickedKey(key);
    startNav(() => router.push(href));
  }

  const items = adminMode ? ADMIN_ITEMS : STUDENT_ITEMS;
  const activeKey = adminMode
    ? pathname.startsWith("/admin/courses") ? "admin-courses"
      : pathname.startsWith("/admin/users") ? "admin-users"
      : "admin"
    : pathname.startsWith("/news") ? "news" : "home";

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
        <nav className="topnav-links">
          {items.map((it) => {
            const busy = clickedKey === it.key && navPending;
            return (
              <button key={it.key} className={"navlink" + (activeKey === it.key ? " is-active" : "")} disabled={navPending} onClick={() => go(it.key, it.href)}>
                {busy ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <it.icon size={20} />}
                <span>{it.label}</span>
                {it.badge && <span className="nav-badge">{it.badge}</span>}
              </button>
            );
          })}
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
