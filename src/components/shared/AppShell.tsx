"use client";
// ============================================================
// Manabi LMS — 共通シェル(ナビ・なりすましバナー・フッター・Tweaks)
// ログイン画面ではクロームを表示しない。
// ============================================================
import React from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import { TopNav, ImpersonationBanner } from "./TopNav";
import { TweaksPanel } from "@/components/tweaks/TweaksPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, hydrated, adminMode } = useApp();
  const pathname = usePathname();

  // 復元前は何も描画しない(ログイン状態のちらつき防止)
  if (!hydrated) return null;

  if (pathname === "/login" || !session) {
    return (
      <>
        {children}
        <TweaksPanel />
      </>
    );
  }

  return (
    <div className="app" data-admin={adminMode ? "1" : "0"}>
      <TopNav />
      <ImpersonationBanner />
      <div className="app-body">{children}</div>
      <TweaksPanel />
      <footer className="app-foot">
        <span>Manabi LMS — ポートフォリオ用デモ</span>
        <span>Next.js · PostgreSQL · Prisma · Auth.js を想定した UI</span>
      </footer>
    </div>
  );
}
