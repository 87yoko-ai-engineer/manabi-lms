"use client";
// ============================================================
// Manabi LMS — 共有UI部品 (ProgressBar / StatusPill / Avatar / Breadcrumb)
// ============================================================
import React from "react";
import Link from "next/link";
import { Icons } from "./Icons";
import { statusOf } from "@/lib/access";
import { User } from "@/lib/data";

export function ProgressBar({ pct, height = 8 }: { pct: number; height?: number }) {
  const st = statusOf(pct);
  const color = st === "done" ? "var(--c-done)" : st === "active" ? "var(--c-active)" : "var(--c-line)";
  return (
    <div className="pbar" style={{ height }}>
      <div className="pbar-fill" style={{ width: pct + "%", background: color }} />
    </div>
  );
}

export function StatusPill({ pct }: { pct: number }) {
  const map = {
    done: { label: "修了", cls: "pill-done" },
    active: { label: "受講中", cls: "pill-active" },
    none: { label: "未着手", cls: "pill-none" },
  } as const;
  const m = map[statusOf(pct)];
  return <span className={"pill " + m.cls}>{m.label}</span>;
}

export function Avatar({ user, size = 34 }: { user: User; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: user.color, fontSize: size * 0.42 }}>
      {user.initials}
    </div>
  );
}

export interface CrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: CrumbItem[] }) {
  return (
    <div className="crumb">
      {items.map((it, i) => (
        <span key={i} className="crumb-row">
          {i > 0 && <Icons.chevRight size={14} style={{ opacity: 0.4 }} />}
          {it.href ? (
            <Link className="crumb-link" href={it.href}>{it.label}</Link>
          ) : (
            <span className="crumb-cur">{it.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
