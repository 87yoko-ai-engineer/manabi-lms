// ============================================================
// Manabi LMS — 受講者編集 (ADM-03) 氏名・メール・パスワード上書き・無効化
// ============================================================
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { UserForm } from "@/components/admin/UserForm";
import { getStudentForEdit } from "@/lib/dal";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getStudentForEdit(id);
  if (!user) notFound();

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "受講者管理", href: "/admin/users" }, { label: user.name }]} />
      <div className="adm-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar user={user} size={46} />
          <div><h1 className="adm-title">受講者編集</h1><p className="adm-sub">{user.email}</p></div>
        </div>
        <Link className="btn-ghost" href={`/admin/users/${user.id}/enrollments`}><Icons.book size={16} />講座割り当てへ</Link>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.users size={19} /><h2>アカウント情報</h2></div>
        <UserForm user={user} />
      </section>
    </div>
  );
}
