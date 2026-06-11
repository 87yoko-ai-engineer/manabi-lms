"use client";
// ============================================================
// Manabi LMS — ユニット視聴 (STU-04,05)
// 完了ボタンは Server Action(toggleUnitProgress)でDBに記録する
// ============================================================
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { toggleUnitProgress } from "@/app/actions";
import type { UnitViewDTO } from "@/lib/types";

export function UnitViewClient({ data }: { data: UnitViewDTO }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [actionErr, setActionErr] = useState("");
  const { course, chapter, unit, done, access, index, total, prevId, nextId, sidebar } = data;
  const locked = !access.viewable;

  function nav(uid: string) {
    router.push(`/courses/${course.id}/units/${uid}`);
  }

  function toggle() {
    setActionErr("");
    start(async () => {
      const res = await toggleUnitProgress(unit.id);
      if (!res.ok) setActionErr(res.error ?? "エラーが発生しました");
    });
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
              <span className="uv-idx">ユニット {index + 1} / {total}</span>
            </div>
            <h1 className="uv-title">{unit.title}</h1>
            <div className="uv-meta">
              <span><Icons.clock size={16} />学習時間目安 {unit.estimatedMinutes} 分</span>
              <span><Icons.book size={16} />{course.title}</span>
            </div>
            <div className="uv-actions">
              <button className={"btn-complete" + (done ? " is-done" : "")} disabled={locked || pending} onClick={toggle}>
                {locked
                  ? <><Icons.lock size={18} />{access.label}のため完了できません</>
                  : pending
                    ? "保存中..."
                    : done
                      ? <><Icons.checkCircle size={20} />完了済み(取り消す)</>
                      : <><Icons.check size={20} />このユニットを完了にする</>}
              </button>
              <div className="uv-nav">
                <button className="btn-ghost" disabled={!prevId} onClick={() => prevId && nav(prevId)}><Icons.chevLeft size={18} />前へ</button>
                <button className="btn-ghost" disabled={!nextId} onClick={() => nextId && nav(nextId)}>次へ<Icons.chevRight size={18} /></button>
              </div>
            </div>
            {actionErr && <div className="login-err" style={{ marginTop: 16 }}><Icons.x size={15} />{actionErr}</div>}
            {done && !actionErr && <div className="uv-done-note"><Icons.sparkle size={16} />進捗に反映されました。お疲れさまでした!</div>}
          </div>
        </main>

        <aside className="uv-side">
          <div className="uv-side-head">
            <span>{course.title}</span>
            <button className="uv-side-back" onClick={() => router.push(`/courses/${course.id}`)}>講座詳細へ</button>
          </div>
          <div className="uv-side-list">
            {sidebar.map((ch) => (
              <div className="uv-side-chap" key={ch.id}>
                <div className="uv-side-chap-t">{ch.title}</div>
                {ch.units.map((u) => {
                  const cur = u.id === unit.id;
                  return (
                    <button key={u.id} className={"uv-side-unit" + (cur ? " is-cur" : "") + (u.done ? " is-done" : "")} onClick={() => nav(u.id)}>
                      <span className={"uv-side-check " + (u.done ? "on" : "")}>{u.done ? <Icons.check size={13} /> : cur ? <Icons.play size={11} /> : ""}</span>
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
