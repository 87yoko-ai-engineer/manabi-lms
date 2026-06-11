// ============================================================
// Manabi LMS — 受講者管理 (ADM-03,04) (Server Component)
// ※発行・編集・割当の実体化は Session 8 で対応
// ============================================================
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { ImpersonateButton } from "@/components/admin/ImpersonateButton";
import { getAdminStudents } from "@/lib/dal";

export default async function AdminUsersPage() {
  const students = await getAdminStudents();

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
            {students.map(({ user, enrollCount, range }) => (
              <tr key={user.id} className={user.isActive ? "" : "is-inactive"}>
                <td>
                  <div className="mx-user">
                    <Avatar user={user} size={32} />
                    <div className="mx-user-meta"><span className="mxu-name">{user.name}</span><span className="mxu-mail">ID: {user.id}</span></div>
                  </div>
                </td>
                <td className="at-dim">{user.email}</td>
                <td>{user.isActive ? <span className="state-on">有効</span> : <span className="state-off">無効</span>}</td>
                <td><span className="enr-badge">{enrollCount} 講座</span></td>
                <td className="at-dim">{range}</td>
                <td className="at-actions">
                  <button className="link-btn">編集</button>
                  <button className="link-btn">割当</button>
                  {user.isActive && <ImpersonateButton studentId={user.id} variant="link" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
