// ============================================================
// Manabi LMS — 新規講座作成 (ADM-01)
// ============================================================
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { CourseForm } from "@/components/admin/CourseForm";

export default function NewCoursePage() {
  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "講座管理", href: "/admin/courses" }, { label: "新規講座" }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">新規講座</h1><p className="adm-sub">基本情報を保存すると、チャプター・ユニットを追加できます</p></div>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.book size={19} /><h2>基本情報</h2></div>
        <CourseForm />
      </section>
    </div>
  );
}
