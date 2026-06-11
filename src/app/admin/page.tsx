"use client";
// ============================================================
// Manabi LMS — 管理ダッシュボード (ADM-05) 進捗集計
// ============================================================
import React from "react";
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons, IconProps } from "@/components/shared/Icons";
import { useApp } from "@/components/providers/AppProvider";
import { USERS, COURSES, ENROLLMENTS, courseUnitIds, courseUnits, Course, User } from "@/lib/data";
import { statusOf } from "@/lib/access";

function isEnrolled(userId: string, courseId: string): boolean {
  return ENROLLMENTS.some((e) => e.userId === userId && e.courseId === courseId);
}

export default function AdminDashboardPage() {
  const { progress, impersonate } = useApp();
  const students = USERS.filter((u) => u.role === "student");

  function pct(userId: string, course: Course): number {
    const ids = courseUnitIds(course);
    if (!ids.length) return 0;
    const set = progress[userId] ?? new Set<string>();
    return Math.round((ids.filter((id) => set.has(id)).length / ids.length) * 100);
  }

  const courseStats = COURSES.map((c) => {
    const enrolled = students.filter((s) => isEnrolled(s.id, c.id));
    const avg = enrolled.length ? Math.round(enrolled.reduce((s, u) => s + pct(u.id, c), 0) / enrolled.length) : 0;
    const doneN = enrolled.filter((u) => pct(u.id, c) >= 100).length;
    return { course: c, enrolled: enrolled.length, avg, doneN };
  });

  function studentAvg(s: User): { avg: number; n: number } {
    const en = COURSES.filter((c) => isEnrolled(s.id, c.id));
    if (!en.length) return { avg: 0, n: 0 };
    return { avg: Math.round(en.reduce((a, c) => a + pct(s.id, c), 0) / en.length), n: en.length };
  }

  const activeStudents = students.filter((s) => s.isActive);
  const overallAvg = Math.round(activeStudents.reduce((a, s) => a + studentAvg(s).avg, 0) / (activeStudents.length || 1));
  const totalEnroll = ENROLLMENTS.length;
  const completedEnroll = ENROLLMENTS.filter((e) => {
    const c = COURSES.find((x) => x.id === e.courseId);
    return c && pct(e.userId, c) >= 100;
  }).length;

  const kpis: { label: string; value: string | number; sub: string; icon: (p?: IconProps) => React.JSX.Element; color: string }[] = [
    { label: "受講者数", value: activeStudents.length, sub: students.length - activeStudents.length + " 名無効", icon: Icons.users, color: "#3B5BDB" },
    { label: "公開講座数", value: COURSES.length, sub: "全 " + COURSES.reduce((a, c) => a + courseUnits(c).length, 0) + " ユニット", icon: Icons.book, color: "#1098AD" },
    { label: "平均進捗率", value: overallAvg + "%", sub: "全受講者の平均", icon: Icons.chart, color: "#E8590C" },
    { label: "修了割当数", value: completedEnroll + "/" + totalEnroll, sub: "受講登録あたり", icon: Icons.award, color: "#6741D9" },
  ];

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "ダッシュボード" }]} />
      <div className="adm-head">
        <div>
          <h1 className="adm-title">進捗ダッシュボード</h1>
          <p className="adm-sub">全受講者の学習進捗を一覧・集計します</p>
        </div>
      </div>

      <div className="kpi-row">
        {kpis.map((k, i) => (
          <div className="kpi" key={i}>
            <span className="kpi-ic" style={{ background: k.color + "18", color: k.color }}><k.icon size={22} /></span>
            <div className="kpi-body">
              <span className="kpi-val">{k.value}</span>
              <span className="kpi-label">{k.label}</span>
            </div>
            <span className="kpi-sub">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="adm-grid">
        {/* 講座別平均修了率 */}
        <section className="panel">
          <div className="panel-head"><Icons.chart size={19} /><h2>講座別 平均修了率</h2></div>
          <div className="course-bars">
            {courseStats.map((cs) => (
              <div className="cbar-row" key={cs.course.id}>
                <div className="cbar-info">
                  <span className="cbar-dot" style={{ background: cs.course.accent }} />
                  <span className="cbar-name">{cs.course.title}</span>
                  <span className="cbar-en">{cs.enrolled}名受講 ・ {cs.doneN}名修了</span>
                </div>
                <div className="cbar-track">
                  <div className="cbar-fill" style={{ width: cs.avg + "%", background: cs.course.accent }}>
                    <span className="cbar-pct">{cs.avg}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 進捗分布 */}
        <section className="panel">
          <div className="panel-head"><Icons.users size={19} /><h2>受講者の状態分布</h2></div>
          <DistRing students={activeStudents} pct={pct} />
        </section>
      </div>

      {/* 受講者 × 講座 マトリクス */}
      <section className="panel">
        <div className="panel-head"><Icons.grid size={19} /><h2>受講者別 進捗一覧</h2><span className="count-badge">{students.length}名</span></div>
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="mx-name">受講者</th>
                {COURSES.map((c) => <th key={c.id} className="mx-course"><span className="mx-dot" style={{ background: c.accent }} />{c.coverLabel}</th>)}
                <th className="mx-avg">平均</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const sa = studentAvg(s);
                return (
                  <tr key={s.id} className={s.isActive ? "" : "is-inactive"}>
                    <td className="mx-name">
                      <div className="mx-user"><Avatar user={s} size={32} />
                        <div className="mx-user-meta"><span className="mxu-name">{s.name}{!s.isActive && <em className="mx-off">無効</em>}</span><span className="mxu-mail">{s.email}</span></div>
                      </div>
                    </td>
                    {COURSES.map((c) => {
                      if (!isEnrolled(s.id, c.id)) return <td key={c.id} className="mx-cell mx-empty">—</td>;
                      const p = pct(s.id, c);
                      return (
                        <td key={c.id} className="mx-cell">
                          <div className="mx-mini">
                            <div className="mx-mini-bar"><span style={{ width: p + "%", background: p >= 100 ? "var(--c-done)" : p > 0 ? "var(--c-active)" : "var(--c-line)" }} /></div>
                            <b>{p}%</b>
                          </div>
                        </td>
                      );
                    })}
                    <td className="mx-avg"><span className={"mx-avg-pill " + statusOf(sa.avg)}>{sa.avg}%</span></td>
                    <td className="mx-act">
                      {s.isActive && <button className="mx-imp" onClick={() => impersonate(s)} title="この受講者として表示">受講画面 <Icons.arrowRight size={14} /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ---- 状態分布リング ----------------------------------------
function DistRing({ students, pct }: { students: User[]; pct: (userId: string, c: Course) => number }) {
  let none = 0, active = 0, done = 0;
  students.forEach((s) => {
    const en = COURSES.filter((c) => isEnrolled(s.id, c.id));
    if (!en.length) return;
    const avg = Math.round(en.reduce((a, c) => a + pct(s.id, c), 0) / en.length);
    const st = statusOf(avg);
    if (st === "done") done++;
    else if (st === "active") active++;
    else none++;
  });
  const total = none + active + done || 1;
  const segs = [
    { label: "修了", v: done, color: "var(--c-done)" },
    { label: "受講中", v: active, color: "var(--c-active)" },
    { label: "未着手", v: none, color: "#CED4DA" },
  ];
  let acc = 0;
  const R = 54, C = 2 * Math.PI * R;
  return (
    <div className="dist">
      <div className="dist-ring">
        <svg viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#EEF1F6" strokeWidth="16" />
          {segs.map((s, i) => {
            const len = (s.v / total) * C;
            const el = <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" strokeLinecap="butt" />;
            acc += len;
            return el;
          })}
        </svg>
        <div className="dist-center"><b>{students.length}</b><span>受講者</span></div>
      </div>
      <div className="dist-legend">
        {segs.map((s, i) => (
          <div className="dist-leg" key={i}><span className="dl-dot" style={{ background: s.color }} /><span className="dl-label">{s.label}</span><span className="dl-val">{s.v}名</span></div>
        ))}
      </div>
    </div>
  );
}
