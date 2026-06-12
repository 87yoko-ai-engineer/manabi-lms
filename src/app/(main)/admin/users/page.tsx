// ============================================================
// Manabi LMS — 受講者管理 (ADM-03,04) (Server Component)
// ※発行・編集・割当の実体化は Session 8 で対応
// ============================================================
import Link from "next/link";
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { ImpersonateButton } from "@/components/admin/ImpersonateButton";
import { DeleteStudentButton } from "@/components/admin/DeleteStudentButton";
import { getAdminStudents } from "@/lib/dal";

export default async function AdminUsersPage() {
  const students = await getAdminStudents();

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "受講者管理" }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">受講者管理</h1><p className="adm-sub">アカウントの発行・編集・無効化、講座の割り当て</p></div>
        <Link className="btn-primary" href="/admin/users/new"><Icons.plus size={17} />受講者を発行</Link>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.users size={19} /><h2>受講者一覧</h2><span className="count-badge">{students.length}名</span></div>
        {/* モバイルでは .atable-cards のCSSで「上段=受講者+操作 / 下段=詳細」の2段カードに組み替わる */}
        <table className="atable atable-cards">
          <thead><tr><th>受講者</th><th>メール</th><th>状態</th><th>割当講座</th><th>受講期間</th><th></th></tr></thead>
          <tbody>
            {students.map(({ user, enrollCount, progressCount, range }) => (
              <tr key={user.id} className={user.isActive ? "" : "is-inactive"}>
                <td className="atc-main">
                  <div className="mx-user">
                    <Avatar user={user} size={32} />
                    <div className="mx-user-meta"><span className="mxu-name">{user.name}</span><span className="mxu-mail">ID: {user.id}</span></div>
                  </div>
                </td>
                <td className="at-dim atc-meta">{user.email}</td>
                <td className="atc-meta">{user.isActive ? <span className="state-on">有効</span> : <span className="state-off">無効</span>}</td>
                <td className="atc-meta"><span className="enr-badge">{enrollCount} 講座</span></td>
                <td className="at-dim atc-meta">{range}</td>
                <td className="at-actions atc-actions">
                  <Link className="link-btn" href={`/admin/users/${user.id}`}>編集</Link>
                  <Link className="link-btn" href={`/admin/users/${user.id}/enrollments`}>割当</Link>
                  {user.isActive && <ImpersonateButton studentId={user.id} variant="link" />}
                  <DeleteStudentButton userId={user.id} name={user.name} enrollCount={enrollCount} progressCount={progressCount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
