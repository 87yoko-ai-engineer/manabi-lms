"use client";
// ============================================================
// Manabi LMS — 受講者管理 (ADM-03,04) ※発行・編集はバックエンド導入後に実体化
// ============================================================
import React from "react";
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { useApp } from "@/components/providers/AppProvider";
import { USERS, ENROLLMENTS } from "@/lib/data";

export default function AdminUsersPage() {
  const { impersonate } = useApp();
  const students = USERS.filter((u) => u.role === "student");

  function enrollCount(uid: string): number {
    return ENROLLMENTS.filter((e) => e.userId === uid).length;
  }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "受講者管理" }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">受講者管理</h1><p className="adm-sub">アカウントの発行・編集・無効化、講座の割り当て</p></div>
        <button className="btn-primary"><Icons.plus size={17} />受講者を発行</button>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.users size={19} /><h2>受講者一覧</h2><span className="count-badge">{students.length}名</span></div>
        <table className="atable">
          <thead><tr><th>受講者</th><th>メール</th><th>状態</th><th>割当講座</th><th>受講期間</th><th></th></tr></thead>
          <tbody>
            {students.map((s) => {
              const en = ENROLLMENTS.filter((e) => e.userId === s.id);
              const range = en.length ? `${en[0].enrollStart} 〜 ${en[0].enrollEnd}` : "—";
              return (
                <tr key={s.id} className={s.isActive ? "" : "is-inactive"}>
                  <td>
                    <div className="mx-user">
                      <Avatar user={s} size={32} />
                      <div className="mx-user-meta"><span className="mxu-name">{s.name}</span><span className="mxu-mail">ID: {s.id}</span></div>
                    </div>
                  </td>
                  <td className="at-dim">{s.email}</td>
                  <td>{s.isActive ? <span className="state-on">有効</span> : <span className="state-off">無効</span>}</td>
                  <td><span className="enr-badge">{enrollCount(s.id)} 講座</span></td>
                  <td className="at-dim">{range}</td>
                  <td className="at-actions">
                    <button className="link-btn">編集</button>
                    <button className="link-btn">割当</button>
                    {s.isActive && <button className="link-btn" onClick={() => impersonate(s)}>受講画面</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
