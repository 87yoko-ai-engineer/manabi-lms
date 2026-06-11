"use client";
// ============================================================
// Manabi LMS — ユニット視聴 (STU-04,05) YouTube埋め込み+完了ボタン
// ============================================================
import React, { use } from "react";
import { useRouter, notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { useApp } from "@/components/providers/AppProvider";
import { findCourse, findUnit, courseUnits } from "@/lib/data";
import { accessOf } from "@/lib/access";

export default function UnitViewPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = use(params);
  const { actingUser, progressOf, toggleUnit } = useApp();
  const router = useRouter();

  const course = findCourse(id);
  const found = findUnit(unitId);
  if (!course || !found || found.course.id !== course.id) notFound();
  if (!actingUser) return null;

  const { unit, chapter } = found;
  const prog = progressOf(actingUser.id);
  const access = accessOf(course, actingUser.id);
  const locked = !access.viewable;
  const done = prog.has(unit.id);

  const units = courseUnits(course);
  const idx = units.findIndex((u) => u.id === unit.id);
  const prev = units[idx - 1];
  const next = units[idx + 1];

  function nav(uid: string) {
    router.push(`/courses/${course!.id}/units/${uid}`);
  }

  return (
    <div className="page uv-page">
      <Breadcrumb items={[
        { label: "ホーム", href: "/" },
        { label: course.title, href: `/courses/${course.id}` },
        { label: unit.title },
      ]} />
      <div className="uv-grid">
        <main className="uv-main">
          <div className="uv-player">
            {locked ? (
              <div className="uv-locked">
                <span className="uv-locked-ic"><Icons.lock size={30} /></span>
                <b>{access.label}</b>
                <span className="uv-locked-msg">{access.msg}</span>
              </div>
            ) : (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${unit.youtubeVideoId}?rel=0&modestbranding=1`}
                title={unit.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="uv-info">
            <div className="uv-info-top">
              <span className="uv-chap">{chapter.title}</span>
              <span className="uv-idx">ユニット {idx + 1} / {units.length}</span>
            </div>
            <h1 className="uv-title">{unit.title}</h1>
            <div className="uv-meta">
              <span><Icons.clock size={16} />学習時間目安 {unit.estimatedMinutes} 分</span>
              <span><Icons.book size={16} />{course.title}</span>
            </div>
            <div className="uv-actions">
              <button className={"btn-complete" + (done ? " is-done" : "")} disabled={locked} onClick={() => !locked && toggleUnit(unit.id)}>
                {locked
                  ? <><Icons.lock size={18} />{access.label}のため完了できません</>
                  : done
                    ? <><Icons.checkCircle size={20} />完了済み(取り消す)</>
                    : <><Icons.check size={20} />このユニットを完了にする</>}
              </button>
              <div className="uv-nav">
                <button className="btn-ghost" disabled={!prev} onClick={() => prev && nav(prev.id)}><Icons.chevLeft size={18} />前へ</button>
                <button className="btn-ghost" disabled={!next} onClick={() => next && nav(next.id)}>次へ<Icons.chevRight size={18} /></button>
              </div>
            </div>
            {done && <div className="uv-done-note"><Icons.sparkle size={16} />進捗に反映されました。お疲れさまでした!</div>}
          </div>
        </main>

        <aside className="uv-side">
          <div className="uv-side-head">
            <span>{course.title}</span>
            <button className="uv-side-back" onClick={() => router.push(`/courses/${course!.id}`)}>講座詳細へ</button>
          </div>
          <div className="uv-side-list">
            {course.chapters.map((ch) => (
              <div className="uv-side-chap" key={ch.id}>
                <div className="uv-side-chap-t">{ch.title}</div>
                {ch.units.map((u) => {
                  const ud = prog.has(u.id);
                  const cur = u.id === unit.id;
                  return (
                    <button key={u.id} className={"uv-side-unit" + (cur ? " is-cur" : "") + (ud ? " is-done" : "")} onClick={() => nav(u.id)}>
                      <span className={"uv-side-check " + (ud ? "on" : "")}>{ud ? <Icons.check size={13} /> : cur ? <Icons.play size={11} /> : ""}</span>
                      <span className="uv-side-title">{u.title}</span>
                      <span className="uv-side-min">{u.estimatedMinutes}分</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
