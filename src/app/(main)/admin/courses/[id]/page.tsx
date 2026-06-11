// ============================================================
// Manabi LMS — 講座編集 (ADM-01,02) 基本情報 + カリキュラム
// ============================================================
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { CourseForm } from "@/components/admin/CourseForm";
import { CurriculumEditor } from "@/components/admin/CurriculumEditor";
import { getAdminCourseEdit } from "@/lib/dal";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getAdminCourseEdit(id);
  if (!course) notFound();

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "講座管理", href: "/admin/courses" }, { label: course.title }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">講座編集</h1><p className="adm-sub">{course.title}</p></div>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.book size={19} /><h2>基本情報</h2></div>
        <CourseForm course={course} />
      </section>
      <section className="panel">
        <div className="panel-head"><Icons.layers size={19} /><h2>カリキュラム</h2>
          <span className="count-badge">{course.chapters.length}章 / {course.chapters.reduce((a, c) => a + c.units.length, 0)}ユニット</span>
        </div>
        <CurriculumEditor course={course} />
      </section>
    </div>
  );
}
