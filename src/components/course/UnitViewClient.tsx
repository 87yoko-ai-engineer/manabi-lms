"use client";
// ============================================================
// Manabi LMS — ユニット視聴 (STU-04,05)
// 完了ボタンは Server Action(toggleUnitProgress)でDBに記録する
// ============================================================
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { toggleUnitProgress } from "@/app/actions";
import type { UnitViewDTO } from "@/lib/types";

export function UnitViewClient({ data }: { data: UnitViewDTO }) {
  const [pending, start] = useTransition();
  const [actionErr, setActionErr] = useState("");
  const { course, chapter, unit, done, access, index, total, prevId, nextId, sidebar } = data;
  const locked = !access.viewable;

  // 「2-1」= 第2章の1本目。サイドバー(講座の全構成)から現在位置を割り出す
  const chIdx = sidebar.findIndex((c) => c.id === chapter.id);
  const uIdx = chIdx >= 0 ? sidebar[chIdx].units.findIndex((u) => u.id === unit.id) : -1;
  const unitNo = chIdx >= 0 && uIdx >= 0 ? `${chIdx + 1}-${uIdx + 1}` : null;

  // UX-4: ユニット間の移動は本物のリンクにする(新しいタブで開く・URLコピーを可能に)
  function unitHref(uid: string) {
    return `/courses/${course.id}/units/${uid}`;
  }

  function toggle() {
    setActionErr("");
    start(async () => {
      const res = await toggleUnitProgress(unit.id);
      if (!res.ok) setActionErr(res.error);
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
              <span className="uv-idx">{unitNo ? `ユニット ${unitNo}(講座全体 ${index + 1} / ${total})` : `ユニット ${index + 1} / ${total}`}</span>
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
                    ? <><span className="spinner" />保存中…</>
                    : done
                      ? <><Icons.checkCircle size={20} />完了済み(取り消す)</>
                      : <><Icons.check size={20} />このユニットを完了にする</>}
              </button>
              <div className="uv-nav">
                {/* 端(前/次がない)では押せないことを示すため disabled なボタンで代替する(リンクに disabled はないため) */}
                {prevId
                  ? <Link className="btn-ghost" href={unitHref(prevId)}><Icons.chevLeft size={18} />前へ</Link>
                  : <button className="btn-ghost" disabled><Icons.chevLeft size={18} />前へ</button>}
                {nextId
                  ? <Link className="btn-ghost" href={unitHref(nextId)}>次へ<Icons.chevRight size={18} /></Link>
                  : <button className="btn-ghost" disabled>次へ<Icons.chevRight size={18} /></button>}
              </div>
            </div>
            {actionErr && <div className="login-err" style={{ marginTop: 16 }}><Icons.x size={15} />{actionErr}</div>}
            {done && !actionErr && <div className="uv-done-note"><Icons.sparkle size={16} />進捗に反映されました。お疲れさまでした!</div>}
          </div>
        </main>

        <aside className="uv-side">
          <div className="uv-side-head">
            <span>{course.title}</span>
            <Link className="uv-side-back" href={`/courses/${course.id}`}>講座詳細へ</Link>
          </div>
          <div className="uv-side-list">
            {sidebar.map((ch, ci) => (
              <div className="uv-side-chap" key={ch.id}>
                <div className="uv-side-chap-t">{ch.title}</div>
                {ch.units.map((u, ui) => {
                  const cur = u.id === unit.id;
                  return (
                    <Link key={u.id} className={"uv-side-unit" + (cur ? " is-cur" : "") + (u.done ? " is-done" : "")} href={unitHref(u.id)}>
                      <span className={"uv-side-check " + (u.done ? "on" : "")}>{u.done ? <Icons.check size={13} /> : cur ? <Icons.play size={11} /> : ""}</span>
                      <span className="uv-side-title"><span className="unit-no">{ci + 1}-{ui + 1}.</span> {u.title}</span>
                      <span className="uv-side-min">{u.estimatedMinutes}分</span>
                    </Link>
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
