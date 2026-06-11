"use client";
// ============================================================
// Manabi LMS — 受講者ホーム用部品 (SummaryCard / CourseCard / SearchSidebar)
// ============================================================
import React from "react";
import { Icons } from "@/components/shared/Icons";
import { ProgressBar, StatusPill } from "@/components/shared/ui";
import type { CourseListItem } from "@/lib/types";

export function SummaryCard({ courses }: { courses: CourseListItem[] }) {
  const total = courses.length;
  const doneCount = courses.filter((c) => c.pct >= 100).length;
  const overall = total ? Math.round(courses.reduce((s, c) => s + c.pct, 0) / total) : 0;
  return (
    <section className="summary">
      <div className="summary-head"><Icons.award size={20} /><h2>修了状況</h2></div>
      <div className="summary-grid">
        <div className="sum-stat">
          <span className="sum-label">修了講座数</span>
          <span className="sum-num">{doneCount}<i>/ {total}</i></span>
        </div>
        <div className="sum-divider" />
        <div className="sum-stat grow">
          <div className="sum-row"><span className="sum-label">全体修了率</span><span className="sum-pct">{overall}%</span></div>
          <ProgressBar pct={overall} height={10} />
        </div>
      </div>
    </section>
  );
}

export function CourseCard({ course, onOpen, layout }: {
  course: CourseListItem;
  onOpen: () => void;
  layout: "row" | "card";
}) {
  const locked = !course.access.viewable;
  return (
    <article className={"ccard " + layout + (locked ? " is-locked" : "")} onClick={onOpen}>
      <div className="ccard-cover" style={{ background: course.cover }}>
        <span className="cover-label">{course.coverLabel}</span>
        <span className={"cover-tag " + (course.tag === "必須" ? "is-req" : "")}>{course.tag}</span>
        {locked && <span className="cover-lock"><Icons.lock size={13} />{course.access.label}</span>}
      </div>
      <div className="ccard-body">
        <div className="ccard-top">
          <span className="ccard-cat">{course.category}</span>
          {locked ? <span className="pill pill-lock"><Icons.lock size={12} />{course.access.label}</span> : <StatusPill pct={course.pct} />}
        </div>
        <h3 className="ccard-title">{course.title}</h3>
        <p className="ccard-desc">{course.description}</p>
        <div className="ccard-meta">
          <span><Icons.clock size={15} />約 {course.minutes} 分</span>
          <span><Icons.layers size={15} />{course.chaptersCount} チャプター</span>
          <span className="ccard-period">{course.publishStart} 〜 {course.publishEnd}</span>
        </div>
        <div className="ccard-prog">
          <div className="ccard-prog-row"><span>進捗</span><b>{course.pct}%</b></div>
          <ProgressBar pct={course.pct} height={8} />
        </div>
      </div>
    </article>
  );
}

export type StatusKey = "all" | "none" | "active" | "done";

export function SearchSidebar({ q, setQ, statusFilter, setStatusFilter, cat, setCat, categories, onClear, counts }: {
  q: string;
  setQ: (v: string) => void;
  statusFilter: StatusKey;
  setStatusFilter: (v: StatusKey) => void;
  cat: string | null;
  setCat: (v: string | null) => void;
  categories: string[];
  onClear: () => void;
  counts: Record<StatusKey, number>;
}) {
  const statuses: { k: StatusKey; label: string; sub?: string }[] = [
    { k: "all", label: "すべて" },
    { k: "none", label: "未着手", sub: "0%" },
    { k: "active", label: "受講中", sub: "1〜99%" },
    { k: "done", label: "修了", sub: "100%" },
  ];
  return (
    <aside className="searchbar">
      <div className="searchbar-head"><Icons.search size={18} /><h3>検索</h3></div>
      <div className="sb-block">
        <span className="sb-label">キーワードで探す</span>
        <div className="sb-input"><Icons.search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="講座名を入力" /></div>
      </div>
      <div className="sb-block">
        <span className="sb-label">進捗状況で探す</span>
        <div className="sb-radios">
          {statuses.map((s) => (
            <button key={s.k} className={"sb-radio" + (statusFilter === s.k ? " is-on" : "")} onClick={() => setStatusFilter(s.k)}>
              <span className="sb-dot" />
              <span className="sb-radio-label">{s.label}{s.sub && <i>{s.sub}</i>}</span>
              <span className="sb-count">{counts[s.k]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="sb-block">
        <span className="sb-label">カテゴリで探す</span>
        <div className="sb-chips">
          {categories.map((c) => (
            <button key={c} className={"sb-chip" + (cat === c ? " is-on" : "")} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
          ))}
        </div>
      </div>
      <button className="btn-ghost full" onClick={onClear}>条件をクリア</button>
    </aside>
  );
}
