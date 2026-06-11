// ============================================================
// Manabi LMS — 講座割り当て (ADM-04) 受講期間の設定
// ============================================================
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, Avatar } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { EnrollmentEditor } from "@/components/admin/EnrollmentEditor";
import { getEnrollmentEditor } from "@/lib/dal";

export default async function EnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEnrollmentEditor(id);
  if (!data) notFound();

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "受講者管理", href: "/admin/users" }, { label: data.student.name }, { label: "講座割り当て" }]} />
      <div className="adm-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar user={data.student} size={46} />
          <div><h1 className="adm-title">講座割り当て</h1><p className="adm-sub">{data.student.name}({data.student.email})の受講講座と受講期間</p></div>
        </div>
        <Link className="btn-ghost" href={`/admin/users/${data.student.id}`}><Icons.users size={16} />アカウント編集へ</Link>
      </div>
      <EnrollmentEditor data={data} />
    </div>
  );
}
