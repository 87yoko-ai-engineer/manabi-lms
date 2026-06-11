// ============================================================
// Manabi LMS — 講座管理 (ADM-01,02) (Server Component)
// ※CRUD操作の実体化は Session 7 で対応
// ============================================================
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { DeleteCourseButton } from "@/components/admin/DeleteCourseButton";
import { getAdminCourses } from "@/lib/dal";

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "講座管理" }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">講座管理</h1><p className="adm-sub">講座・チャプター・ユニットの作成と編集</p></div>
        <Link className="btn-primary" href="/admin/courses/new"><Icons.plus size={17} />新規講座</Link>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.book size={19} /><h2>講座一覧</h2><span className="count-badge">{courses.length}件</span></div>
        <table className="atable">
          <thead><tr><th>講座</th><th>カテゴリ</th><th>区分</th><th>構成</th><th>公開期間</th><th></th></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="at-course">
                    <span className="at-cover" style={{ background: c.cover }}>{c.coverLabel}</span>
                    <div><span className="at-title">{c.title}</span><span className="at-sub">{c.subtitle}</span></div>
                  </div>
                </td>
                <td><span className="tag-soft">{c.category}</span></td>
                <td><span className={"cover-tag sm " + (c.tag === "必須" ? "is-req" : "")}>{c.tag}</span></td>
                <td className="at-dim">{c.chaptersCount}章 / {c.unitCount}ユニット / 約{c.minutes}分</td>
                <td className="at-dim">{c.publishStart}<br />〜 {c.publishEnd}</td>
                <td className="at-actions">
                  <Link className="link-btn" href={`/admin/courses/${c.id}`}>編集</Link>
                  <DeleteCourseButton courseId={c.id} title={c.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
