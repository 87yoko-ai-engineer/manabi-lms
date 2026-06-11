"use client";
// ============================================================
// Manabi LMS — 講座割り当てエディタ (ADM-04)
// 受講期間(開始日・終了日)の設定・更新・割当解除。
// 二重割り当ては複合ユニーク制約 + upsert で防止。
// 各行が独立した処理状態を持ち、操作中はスピナーを表示する。
// ============================================================
import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Icons } from "@/components/shared/Icons";
import { assignCourse, unassignCourse, ActionResult } from "@/app/admin-actions";
import type { EnrollmentEditorData } from "@/lib/types";

type Row = EnrollmentEditorData["rows"][number];

export function EnrollmentEditor({ data }: { data: EnrollmentEditorData }) {
  const [err, setErr] = useState("");

  return (
    <section className="panel">
      <div className="panel-head"><Icons.book size={19} /><h2>講座割り当て</h2><span className="count-badge">{data.rows.filter((r) => r.enrollStart).length} / {data.rows.length} 講座</span></div>
      <table className="atable">
        <thead><tr><th>講座</th><th>公開期間</th><th>受講期間(開始 〜 終了)</th><th></th></tr></thead>
        <tbody>
          {data.rows.map((r) => (
            <EnrollmentRow key={r.courseId} row={r} userId={data.student.id} onError={setErr} />
          ))}
        </tbody>
      </table>
      {err && <div className="form-err" style={{ marginTop: 14 }}><Icons.x size={15} />{err}</div>}
      <p className="ed-hint">割当を解除しても完了記録は削除されません(再割当で進捗が復元されます)。</p>
    </section>
  );
}

function EnrollmentRow({ row, userId, onError }: {
  row: Row;
  userId: string;
  onError: (msg: string) => void;
}) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"assign" | "update" | "unassign" | null>(null);
  const assigned = !!row.enrollStart;
  const [startDate, setStartDate] = useState(row.enrollStart ?? "");
  const [endDate, setEndDate] = useState(row.enrollEnd ?? "");
  const dirty = assigned && (startDate !== row.enrollStart || endDate !== row.enrollEnd);
  // 受講期間が公開期間からはみ出していないか("YYYY-MM-DD"形式は文字列比較で大小判定できる)
  const mismatch =
    (startDate && startDate < row.publishStart) || (endDate && endDate > row.publishEnd);

  function run(kind: "assign" | "update" | "unassign", action: () => Promise<ActionResult>) {
    onError("");
    setBusy(kind);
    start(async () => {
      const res = await action();
      if (!res.ok) onError(res.error);
      setBusy(null);
    });
  }

  return (
    <tr className={assigned ? "" : "enr-unassigned"}>
      <td>
        <div className="at-course">
          <span className="at-cover" style={{ background: row.cover }}>{row.coverLabel}</span>
          <div><span className="at-title">{row.title}</span><span className="at-sub">{row.category}</span></div>
        </div>
      </td>
      <td className="at-dim">
        <Link href={`/admin/courses/${row.courseId}`} className="crumb-link" title="公開期間は講座全体の設定です。クリックで講座編集ページへ移動します">
          {row.publishRange}
        </Link>
      </td>
      <td>
        <div className="enr-row-dates">
          <span className="enr-date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></span>
          <span style={{ color: "var(--ink-4)" }}>〜</span>
          <span className="enr-date"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></span>
        </div>
        {mismatch && (
          <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, color: "#C92A2A", display: "flex", alignItems: "center", gap: 5 }}>
            <Icons.lock size={12} />受講期間が公開期間の外にあります(その期間は視聴できません)
          </div>
        )}
      </td>
      <td className="at-actions">
        {assigned ? (
          <>
            <button className="link-btn" disabled={pending || !dirty} style={!dirty ? { opacity: 0.35 } : undefined}
              onClick={() => run("update", () => assignCourse(userId, row.courseId, startDate, endDate))}>
              {busy === "update" ? <><span className="spinner sm" /> 更新中…</> : "期間を更新"}
            </button>
            <button className="link-btn danger" disabled={pending} onClick={() => {
              if (confirm(`「${row.title}」の割当を解除しますか?`)) run("unassign", () => unassignCourse(userId, row.courseId));
            }}>
              {busy === "unassign" ? <><span className="spinner sm" /> 解除中…</> : "解除"}
            </button>
          </>
        ) : (
          <button className="link-btn" disabled={pending} onClick={() => run("assign", () => assignCourse(userId, row.courseId, startDate, endDate))}>
            {busy === "assign" ? <><span className="spinner sm" /> 割当中…</> : "割当"}
          </button>
        )}
      </td>
    </tr>
  );
}
