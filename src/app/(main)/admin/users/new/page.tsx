// ============================================================
// Manabi LMS — 受講者アカウント発行 (ADM-03 / AUTH-05)
// ============================================================
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { UserForm } from "@/components/admin/UserForm";

export default function NewUserPage() {
  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "受講者管理", href: "/admin/users" }, { label: "受講者を発行" }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">受講者を発行</h1><p className="adm-sub">メール・氏名・初期パスワードを設定して配布します。発行後に講座を割り当てられます</p></div>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.users size={19} /><h2>アカウント情報</h2></div>
        <UserForm />
      </section>
    </div>
  );
}
