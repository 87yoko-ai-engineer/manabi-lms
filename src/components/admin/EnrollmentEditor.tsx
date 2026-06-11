"use client";
// ============================================================
// Manabi LMS — 講座割り当てエディタ (ADM-04)
// 受講期間(開始日・終了日)の設定・更新・割当解除。
// 二重割り当ては複合ユニーク制約 + upsert で防止。
// ============================================================
import React, { useState, useTransition } from "react";
import { Icons } from "@/components/shared/Icons";
import { assignCourse, unassignCourse, ActionResult } from "@/app/admin-actions";
import type { EnrollmentEditorData } from "@/lib/types";

type Row = EnrollmentEditorData["rows"][number];

export function EnrollmentEditor({ data }: { data: EnrollmentEditorData }) {
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    setErr("");
    start(async () => {
      const res = await action();
      if (!res.ok) setErr(res.error);
    });
  }

  return (
    <section className="panel">
      <div className="panel-head"><Icons.book size={19} /><h2>講座割り当て</h2><span className="count-badge">{data.rows.filter((r) => r.enrollStart).length} / {data.rows.length} 講座</span></div>
      <table className="atable">
        <thead><tr><th>講座</th><th>公開期間</th><th>受講期間(開始 〜 終了)</th><th></th></tr></thead>
        <tbody>
          {data.rows.map((r) => (
            <EnrollmentRow key={r.courseId} row={r} userId={data.student.id} run={run} pending={pending} />
          ))}
        </tbody>
      </table>
      {err && <div className="form-err" style={{ marginTop: 14 }}><Icons.x size={15} />{err}</div>}
      <p className="ed-hint">割当を解除しても完了記録は削除されません(再割当で進捗が復元されます)。</p>
    </section>
  );
}

function EnrollmentRow({ row, userId, run, pending }: {
  row: Row;
  userId: string;
  run: (a: () => Promise<ActionResult>) => void;
  pending: boolean;
}) {
  const assigned = !!row.enrollStart;
  const [start, setStart] = useState(row.enrollStart ?? "");
  const [end, setEnd] = useState(row.enrollEnd ?? "");
  const dirty = assigned && (start !== row.enrollStart || end !== row.enrollEnd);

  return (
    <tr className={assigned ? "" : "enr-unassigned"}>
      <td>
        <div className="at-course">
          <span className="at-cover" style={{ background: row.cover }}>{row.coverLabel}</span>
          <div><span className="at-title">{row.title}</span><span className="at-sub">{row.category}</span></div>
        </div>
      </td>
      <td className="at-dim">{row.publishRange}</td>
      <td>
        <div className="enr-row-dates">
          <span className="enr-date"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></span>
          <span style={{ color: "var(--ink-4)" }}>〜</span>
          <span className="enr-date"><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></span>
        </div>
      </td>
      <td className="at-actions">
        {assigned ? (
          <>
            <button className="link-btn" disabled={pending || !dirty} style={!dirty ? { opacity: 0.35 } : undefined}
              onClick={() => run(() => assignCourse(userId, row.courseId, start, end))}>期間を更新</button>
            <button className="link-btn danger" disabled={pending} onClick={() => {
              if (confirm(`「${row.title}」の割当を解除しますか?`)) run(() => unassignCourse(userId, row.courseId));
            }}>解除</button>
          </>
        ) : (
          <button className="link-btn" disabled={pending} onClick={() => run(() => assignCourse(userId, row.courseId, start, end))}>割当</button>
        )}
      </td>
    </tr>
  );
}
