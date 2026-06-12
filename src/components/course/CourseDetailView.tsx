"use client";
// ============================================================
// Manabi LMS — 講座詳細の表示 (STU-03) チャプターアコーディオン
// ============================================================
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb, ProgressBar, StatusPill } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { computePct } from "@/lib/access";
import type { CourseDetailDTO } from "@/lib/types";

export function CourseDetailView({ course }: { course: CourseDetailDTO }) {
  const router = useRouter();
  const [closed, setClosed] = useState<string[]>([]); // 初期状態はすべて開く
  const locked = !course.access.viewable;

  function toggle(chId: string) {
    setClosed((o) => (o.includes(chId) ? o.filter((x) => x !== chId) : [...o, chId]));
  }
  function openUnit(unitId: string) {
    router.push(`/courses/${course.id}/units/${unitId}`);
  }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "講座一覧", href: "/" }, { label: course.title }]} />

      <section className="cd-hero" style={{ "--accent": course.accent } as React.CSSProperties}>
        <div className="cd-hero-cover" style={{ background: course.cover }}>
          <span className="cover-label lg">{course.coverLabel}</span>
        </div>
        <div className="cd-hero-body">
          <div className="cd-hero-top">
            <span className="ccard-cat">{course.category}</span>
            <span className={"cover-tag " + (course.tag === "必須" ? "is-req" : "")}>{course.tag}</span>
            <StatusPill pct={course.pct} />
          </div>
          <h1 className="cd-title">{course.title}</h1>
          <p className="cd-desc">{course.description}</p>
          {course.goals.length > 0 && (
            <div className="cd-goals">
              <span className="cd-goals-label">学習ゴール</span>
              <ul>{course.goals.map((g, i) => <li key={i}><Icons.check size={14} />{g}</li>)}</ul>
            </div>
          )}
          <div className="cd-facts">
            <div className="cd-fact"><span className="cdf-label">受講期間</span><span className="cdf-val">{course.publishStart} 〜 {course.publishEnd}</span></div>
            <div className="cd-fact"><span className="cdf-label">構成</span><span className="cdf-val">{course.chapters.length} チャプター・{course.unitCount} ユニット</span></div>
            <div className="cd-fact"><span className="cdf-label">学習時間目安</span><span className="cdf-val">約 {course.minutes} 分</span></div>
          </div>
        </div>
        <div className="cd-hero-prog">
          <div className="cd-ring" style={{ "--pct": course.pct, "--ring": course.pct >= 100 ? "var(--c-done)" : "var(--c-active)" } as React.CSSProperties}>
            <svg viewBox="0 0 100 100"><circle className="ring-bg" cx="50" cy="50" r="42" /><circle className="ring-fg" cx="50" cy="50" r="42" /></svg>
            <div className="cd-ring-c"><b>{course.pct}%</b><span>修了率</span></div>
          </div>
          <div className="cd-ring-meta">{course.doneCount} / {course.unitCount} ユニット完了</div>
          {locked ? (
            <div className="cd-locked"><Icons.lock size={15} /><b>{course.access.label}</b><span>{course.access.msg}</span></div>
          ) : (
            course.nextUnitId && (
              <button className="btn-primary full" onClick={() => openUnit(course.nextUnitId!)}>
                <Icons.play size={16} />{course.doneCount === 0 ? "学習をはじめる" : course.pct >= 100 ? "もう一度見る" : "続きから学習"}
              </button>
            )
          )}
        </div>
      </section>

      <div className="cd-list-head"><Icons.layers size={20} /><h2>カリキュラム</h2></div>

      <div className="chapters">
        {course.chapters.map((ch, ci) => {
          const cDone = ch.units.filter((u) => u.done).length;
          const isOpen = !closed.includes(ch.id);
          return (
            <div className={"chapter" + (isOpen ? " is-open" : "")} key={ch.id}>
              <button className="chapter-head" onClick={() => toggle(ch.id)}>
                <span className="chapter-chev"><Icons.chevDown size={20} /></span>
                <span className="chapter-title">{ch.title}</span>
                <span className="chapter-meta">{cDone}/{ch.units.length} 完了</span>
                <span className="chapter-bar"><ProgressBar pct={computePct(cDone, ch.units.length)} height={6} /></span>
              </button>
              {isOpen && (
                <ul className="units">
                  {ch.units.map((u, ui) => (
                    <li key={u.id} className={"unit" + (u.done ? " is-done" : "")} onClick={() => openUnit(u.id)}>
                      <span className={"unit-check " + (u.done ? "on" : "")}>{u.done && <Icons.check size={15} />}</span>
                      <span className="unit-play"><Icons.playC size={20} /></span>
                      <span className="unit-title"><span className="unit-no">{ci + 1}-{ui + 1}.</span> {u.title}</span>
                      <span className="unit-min"><Icons.clock size={14} />{u.estimatedMinutes}分</span>
                      <span className="unit-go"><Icons.chevRight size={18} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
