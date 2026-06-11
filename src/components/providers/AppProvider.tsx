"use client";
// ============================================================
// Manabi LMS — アプリ状態(モック認証・進捗・Tweaks)
// バックエンド導入時: session → Auth.js、progress → Server Actions に置換。
// ============================================================
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { USERS, INITIAL_PROGRESS, User } from "@/lib/data";

export interface Tweaks {
  accent: string;
  layout: "row" | "card";
  density: "comfortable" | "compact";
}

interface AppState {
  session: User | null;
  viewAs: User | null;
  /** 受講者視点で見ているユーザー(なりすまし中は viewAs) */
  actingUser: User | null;
  adminMode: boolean;
  progress: Record<string, Set<string>>;
  tweaks: Tweaks;
  hydrated: boolean;
  login: (u: User) => void;
  logout: () => void;
  impersonate: (u: User) => void;
  stopImpersonate: () => void;
  toggleUnit: (unitId: string) => void;
  progressOf: (userId: string) => Set<string>;
  setTweaks: React.Dispatch<React.SetStateAction<Tweaks>>;
}

const AppContext = createContext<AppState | null>(null);

const LS_KEY = "manabi-lms-state-v1";
const DEFAULT_TWEAKS: Tweaks = { accent: "#3B5BDB", layout: "row", density: "comfortable" };

function initialProgress(): Record<string, Set<string>> {
  const o: Record<string, Set<string>> = {};
  for (const [k, ids] of Object.entries(INITIAL_PROGRESS)) o[k] = new Set(ids);
  return o;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [viewAs, setViewAs] = useState<User | null>(null);
  const [progress, setProgress] = useState<Record<string, Set<string>>>(initialProgress);
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // ---- localStorage 復元(初回マウント時) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.sessionId) setSession(USERS.find((u) => u.id === s.sessionId) ?? null);
        if (s.viewAsId) setViewAs(USERS.find((u) => u.id === s.viewAsId) ?? null);
        if (s.progress) {
          const p: Record<string, Set<string>> = initialProgress();
          for (const [k, ids] of Object.entries(s.progress as Record<string, string[]>)) p[k] = new Set(ids);
          setProgress(p);
        }
        if (s.tweaks) setTweaks({ ...DEFAULT_TWEAKS, ...s.tweaks });
      }
    } catch {
      // 壊れた保存データは無視して初期状態で開始
    }
    setHydrated(true);
  }, []);

  // ---- localStorage 保存 ----
  useEffect(() => {
    if (!hydrated) return;
    const serial = {
      sessionId: session?.id ?? null,
      viewAsId: viewAs?.id ?? null,
      progress: Object.fromEntries(Object.entries(progress).map(([k, v]) => [k, [...v]])),
      tweaks,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(serial));
  }, [hydrated, session, viewAs, progress, tweaks]);

  // ---- Tweaks をドキュメントに反映 ----
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", tweaks.accent);
  }, [tweaks.accent]);
  useEffect(() => {
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.density]);

  // ---- アクセス制御(AUTH-04 のクライアント側仮実装) ----
  useEffect(() => {
    if (!hydrated) return;
    const isLogin = pathname === "/login";
    if (!session && !isLogin) {
      router.replace("/login");
      return;
    }
    if (session && isLogin) {
      router.replace(session.role === "admin" ? "/admin" : "/");
      return;
    }
    const adminArea = pathname.startsWith("/admin");
    const adminActing = session?.role === "admin" && !viewAs;
    if (session && adminArea && !adminActing) router.replace("/");
    // 管理者本人(なりすまし中でない)が受講者画面を見たら管理画面へ
    if (session && !adminArea && !isLogin && adminActing) router.replace("/admin");
  }, [hydrated, session, viewAs, pathname, router]);

  const actingUser = viewAs ?? session;
  const adminMode = !!session && session.role === "admin" && !viewAs;

  function progressOf(userId: string): Set<string> {
    return progress[userId] ?? new Set();
  }

  function toggleUnit(unitId: string) {
    if (!actingUser) return;
    const uid = actingUser.id;
    setProgress((p) => {
      const next = { ...p };
      const set = new Set(next[uid] ?? []);
      if (set.has(unitId)) set.delete(unitId);
      else set.add(unitId);
      next[uid] = set;
      return next;
    });
  }

  function login(u: User) {
    setSession(u);
    setViewAs(null);
    router.push(u.role === "admin" ? "/admin" : "/");
  }
  function logout() {
    setSession(null);
    setViewAs(null);
    router.push("/login");
  }
  function impersonate(u: User) {
    setViewAs(u);
    router.push("/");
  }
  function stopImpersonate() {
    setViewAs(null);
    router.push("/admin");
  }

  return (
    <AppContext.Provider
      value={{ session, viewAs, actingUser, adminMode, progress, tweaks, hydrated,
        login, logout, impersonate, stopImpersonate, toggleUnit, progressOf, setTweaks }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
