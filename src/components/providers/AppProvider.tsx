"use client";
// ============================================================
// Manabi LMS — アプリ状態
// 認証: Auth.js セッション(本物)
// 進捗・なりすまし・Tweaks: localStorage(Session 4〜9 でDBへ移行予定)
// ============================================================
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  logout: () => void;
  impersonate: (u: User) => void;
  stopImpersonate: () => void;
  toggleUnit: (unitId: string) => void;
  progressOf: (userId: string) => Set<string>;
  setTweaks: React.Dispatch<React.SetStateAction<Tweaks>>;
}

const AppContext = createContext<AppState | null>(null);

const LS_KEY = "manabi-lms-state-v2";
const DEFAULT_TWEAKS: Tweaks = { accent: "#3B5BDB", layout: "row", density: "comfortable" };

function initialProgress(): Record<string, Set<string>> {
  const o: Record<string, Set<string>> = {};
  for (const [k, ids] of Object.entries(INITIAL_PROGRESS)) o[k] = new Set(ids);
  return o;
}

/** Auth.jsセッションのユーザーを、UI用のUser型(initials/color付き)へ変換 */
function toUiUser(id: string | undefined, name?: string | null, email?: string | null, role?: "admin" | "student"): User | null {
  if (!id) return null;
  const known = USERS.find((u) => u.id === id);
  if (known) return known;
  return {
    id,
    name: name ?? "",
    email: email ?? "",
    role: role ?? "student",
    isActive: true,
    initials: (name ?? "?").charAt(0),
    color: "#3B5BDB",
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: authSession, status } = useSession();
  const [viewAs, setViewAs] = useState<User | null>(null);
  const [progress, setProgress] = useState<Record<string, Set<string>>>(initialProgress);
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [lsLoaded, setLsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const session = toUiUser(authSession?.user?.id, authSession?.user?.name, authSession?.user?.email, authSession?.user?.role);
  const hydrated = lsLoaded && status !== "loading";

  // ---- localStorage 復元(初回マウント時) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
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
    setLsLoaded(true);
  }, []);

  // ---- localStorage 保存 ----
  useEffect(() => {
    if (!lsLoaded) return;
    const serial = {
      viewAsId: viewAs?.id ?? null,
      progress: Object.fromEntries(Object.entries(progress).map(([k, v]) => [k, [...v]])),
      tweaks,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(serial));
  }, [lsLoaded, viewAs, progress, tweaks]);

  // ---- Tweaks をドキュメントに反映 ----
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", tweaks.accent);
  }, [tweaks.accent]);
  useEffect(() => {
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.density]);

  // ---- なりすましの整合性: 管理者以外のセッションでは無効 ----
  useEffect(() => {
    if (hydrated && viewAs && session?.role !== "admin") setViewAs(null);
  }, [hydrated, viewAs, session?.role]);

  // ---- 画面振り分け(認可はmiddlewareが担当。ここはUX用のルーティングのみ) ----
  // 管理者本人(なりすまし中でない)が受講者画面を開いたら管理画面へ
  useEffect(() => {
    if (!hydrated || !session) return;
    const adminActing = session.role === "admin" && !viewAs;
    const isAdminArea = pathname.startsWith("/admin");
    const isLogin = pathname === "/login";
    if (adminActing && !isAdminArea && !isLogin) router.replace("/admin");
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

  function logout() {
    setViewAs(null);
    signOut({ redirectTo: "/login" });
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
        logout, impersonate, stopImpersonate, toggleUnit, progressOf, setTweaks }}
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
