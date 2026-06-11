"use client";
// ============================================================
// Manabi LMS — Tweaks状態(ブランドカラー/レイアウト/密度)
// デザイン検討用のローカル設定。localStorageに保存。
// ============================================================
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Tweaks {
  accent: string;
  layout: "row" | "card";
  density: "comfortable" | "compact";
}

interface TweaksState {
  tweaks: Tweaks;
  setTweaks: React.Dispatch<React.SetStateAction<Tweaks>>;
}

const TweaksContext = createContext<TweaksState | null>(null);

const LS_KEY = "manabi-lms-tweaks-v1";
const DEFAULT_TWEAKS: Tweaks = { accent: "#3B5BDB", layout: "row", density: "comfortable" };

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setTweaks({ ...DEFAULT_TWEAKS, ...JSON.parse(raw) });
    } catch {
      // 壊れた保存データは無視
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(LS_KEY, JSON.stringify(tweaks));
  }, [loaded, tweaks]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", tweaks.accent);
  }, [tweaks.accent]);
  useEffect(() => {
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.density]);

  return <TweaksContext.Provider value={{ tweaks, setTweaks }}>{children}</TweaksContext.Provider>;
}

export function useTweaks(): TweaksState {
  const ctx = useContext(TweaksContext);
  if (!ctx) throw new Error("useTweaks must be used within TweaksProvider");
  return ctx;
}
