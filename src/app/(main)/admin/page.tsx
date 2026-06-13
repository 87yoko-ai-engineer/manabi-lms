// ============================================================
// Manabi LMS — 管理ダッシュボード (ADM-05) (Server Component)
// 集計はDAL(getAdminDashboard)でDBから算出
// ============================================================
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons, IconProps } from "@/components/shared/Icons";
import { ImpersonateButton } from "@/components/admin/ImpersonateButton";
import { DragScroll } from "@/components/shared/DragScroll";
import { getAdminDashboard } from "@/lib/dal";
import { statusOf } from "@/lib/access";

export default async function AdminDashboardPage() {
  const dash = await getAdminDashboard();
  const { kpis, courseStats, students } = dash;

  const kpiCards: { label: string; value: string | number; sub: string; icon: (p?: IconProps) => React.JSX.Element; color: string }[] = [
    { label: "受講者数", value: kpis.activeStudents, sub: kpis.inactiveStudents + " 名無効", icon: Icons.users, color: "#3B5BDB" },
    { label: "公開講座数", value: kpis.courseCount, sub: "全 " + kpis.unitCount + " ユニット", icon: Icons.book, color: "#1098AD" },
    { label: "平均進捗率", value: kpis.overallAvg + "%", sub: "全受講者の平均", icon: Icons.chart, color: "#E8590C" },
    { label: "修了割当数", value: kpis.completedEnroll + "/" + kpis.totalEnroll, sub: "受講登録あたり", icon: Icons.award, color: "#6741D9" },
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
        {kpiCards.map((k, i) => (
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
              <div className="cbar-row" key={cs.id}>
                <div className="cbar-info">
                  <span className="cbar-dot" style={{ background: cs.accent }} />
                  <span className="cbar-name">{cs.title}</span>
                  <span className="cbar-en">{cs.enrolled}名受講 ・ {cs.doneN}名修了</span>
                </div>
                <div className="cbar-track">
                  <div className="cbar-fill" style={{ width: cs.avg + "%", background: cs.accent }}>
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
          <DistRing students={students} />
        </section>
      </div>

      {/* 受講者 × 講座 マトリクス */}
      <section className="panel">
        <div className="panel-head"><Icons.grid size={19} /><h2>受講者別 進捗一覧</h2><span className="count-badge">{students.length}名</span></div>
        {/* モバイル(720px以下)でのみ表示される横スクロールの案内 */}
        <p className="scroll-hint"><Icons.arrowRight size={12} />表は左右にドラッグ(スワイプ)できます</p>
        <div className="matrix-outer">
        <DragScroll className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="mx-name">受講者</th>
                {/* UX-7: 略称だけでは何の講座か分からないため、ホバーで講座名を表示(凡例は表の下) */}
                {courseStats.map((c) => <th key={c.id} className="mx-course" title={c.title}><span className="mx-dot" style={{ background: c.accent }} />{c.coverLabel}</th>)}
                <th className="mx-avg">平均</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.user.id} className={s.user.isActive ? "" : "is-inactive"}>
                  <td className="mx-name">
                    <div className="mx-user"><Avatar user={s.user} size={32} />
                      <div className="mx-user-meta"><span className="mxu-name">{s.user.name}{!s.user.isActive && <em className="mx-off">無効</em>}</span><span className="mxu-mail">{s.user.email}</span></div>
                    </div>
                  </td>
                  {s.cells.map((cell, i) => {
                    if (!cell) return <td key={i} className="mx-cell mx-empty">—</td>;
                    return (
                      <td key={i} className="mx-cell">
                        <div className="mx-mini">
                          <div className="mx-mini-bar"><span style={{ width: cell.pct + "%", background: cell.pct >= 100 ? "var(--c-done)" : cell.pct > 0 ? "var(--c-active)" : "var(--c-line)" }} /></div>
                          <b>{cell.pct}%</b>
                        </div>
                      </td>
                    );
                  })}
                  <td className="mx-avg"><span className={"mx-avg-pill " + statusOf(s.avg)}>{s.avg}%</span></td>
                  <td className="mx-act">
                    {s.user.isActive && <ImpersonateButton studentId={s.user.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DragScroll>
        </div>
        {/* UX-7: 列ヘッダー略称の凡例(ツールチップが使えないタッチ端末でも分かるように) */}
        <div className="mx-legend">
          {courseStats.map((c) => (
            <span className="mx-leg" key={c.id}>
              <span className="mx-dot" style={{ background: c.accent }} />
              <b>{c.coverLabel}</b> = {c.title}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---- 状態分布リング(Server Componentでも描画可能な純SVG) ----
function DistRing({ students }: { students: { user: { isActive: boolean }; cells: ({ pct: number } | null)[]; avg: number }[] }) {
  let none = 0, active = 0, done = 0;
  for (const s of students) {
    if (!s.user.isActive) continue;
    if (!s.cells.some((c) => c)) continue;
    const st = statusOf(s.avg);
    if (st === "done") done++;
    else if (st === "active") active++;
    else none++;
  }
  const totalStudents = students.filter((s) => s.user.isActive).length;
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
        <div className="dist-center"><b>{totalStudents}</b><span>受講者</span></div>
      </div>
      <div className="dist-legend">
        {segs.map((s, i) => (
          <div className="dist-leg" key={i}><span className="dl-dot" style={{ background: s.color }} /><span className="dl-label">{s.label}</span><span className="dl-val">{s.v}名</span></div>
        ))}
      </div>
    </div>
  );
}
