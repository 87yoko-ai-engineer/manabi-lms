"use client";
// ============================================================
// Manabi LMS — 講座詳細 (STU-03) チャプター → ユニット階層
// ============================================================
import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { Breadcrumb, ProgressBar, StatusPill } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { useApp } from "@/components/providers/AppProvider";
import { findCourse, courseUnits, courseTotalMinutes } from "@/lib/data";
import { accessOf, pctOf } from "@/lib/access";

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { actingUser, progressOf } = useApp();
  const router = useRouter();
  const course = findCourse(id);
  const [closed, setClosed] = useState<string[]>([]); // 初期状態はすべて開く

  if (!course) notFound();
  if (!actingUser) return null;

  const prog = progressOf(actingUser.id);
  const access = accessOf(course, actingUser.id);
  const locked = !access.viewable;
  const allUnits = courseUnits(course);
  const doneCount = allUnits.filter((u) => prog.has(u.id)).length;
  const pct = pctOf(course, prog);
  const nextUnit = allUnits.find((u) => !prog.has(u.id)) ?? allUnits[0];

  function toggle(chId: string) {
    setClosed((o) => (o.includes(chId) ? o.filter((x) => x !== chId) : [...o, chId]));
  }
  function openUnit(unitId: string) {
    router.push(`/courses/${course!.id}/units/${unitId}`);
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
            <StatusPill pct={pct} />
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
            <div className="cd-fact"><span className="cdf-label">構成</span><span className="cdf-val">{course.chapters.length} チャプター・{allUnits.length} ユニット</span></div>
            <div className="cd-fact"><span className="cdf-label">学習時間目安</span><span className="cdf-val">約 {courseTotalMinutes(course)} 分</span></div>
          </div>
        </div>
        <div className="cd-hero-prog">
          <div className="cd-ring" style={{ "--pct": pct, "--ring": pct >= 100 ? "var(--c-done)" : "var(--c-active)" } as React.CSSProperties}>
            <svg viewBox="0 0 100 100"><circle className="ring-bg" cx="50" cy="50" r="42" /><circle className="ring-fg" cx="50" cy="50" r="42" /></svg>
            <div className="cd-ring-c"><b>{pct}%</b><span>修了率</span></div>
          </div>
          <div className="cd-ring-meta">{doneCount} / {allUnits.length} ユニット完了</div>
          {locked ? (
            <div className="cd-locked"><Icons.lock size={15} /><b>{access.label}</b><span>{access.msg}</span></div>
          ) : (
            <button className="btn-primary full" onClick={() => openUnit(nextUnit.id)}>
              <Icons.play size={16} />{doneCount === 0 ? "学習をはじめる" : pct >= 100 ? "もう一度見る" : "続きから学習"}
            </button>
          )}
        </div>
      </section>

      <div className="cd-list-head"><Icons.layers size={20} /><h2>カリキュラム</h2></div>

      <div className="chapters">
        {course.chapters.map((ch) => {
          const cDone = ch.units.filter((u) => prog.has(u.id)).length;
          const isOpen = !closed.includes(ch.id);
          return (
            <div className={"chapter" + (isOpen ? " is-open" : "")} key={ch.id}>
              <button className="chapter-head" onClick={() => toggle(ch.id)}>
                <span className="chapter-chev"><Icons.chevDown size={20} /></span>
                <span className="chapter-title">{ch.title}</span>
                <span className="chapter-meta">{cDone}/{ch.units.length} 完了</span>
                <span className="chapter-bar"><ProgressBar pct={Math.round((cDone / ch.units.length) * 100)} height={6} /></span>
              </button>
              {isOpen && (
                <ul className="units">
                  {ch.units.map((u, ui) => {
                    const done = prog.has(u.id);
                    return (
                      <li key={u.id} className={"unit" + (done ? " is-done" : "")} onClick={() => openUnit(u.id)}>
                        <span className={"unit-check " + (done ? "on" : "")}>{done ? <Icons.check size={15} /> : <span className="unit-num">{ui + 1}</span>}</span>
                        <span className="unit-play"><Icons.playC size={20} /></span>
                        <span className="unit-title">{u.title}</span>
                        <span className="unit-min"><Icons.clock size={14} />{u.estimatedMinutes}分</span>
                        <span className="unit-go"><Icons.chevRight size={18} /></span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
