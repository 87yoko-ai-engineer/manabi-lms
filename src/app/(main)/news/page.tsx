// ============================================================
// Manabi LMS — お知らせ一覧(デモ用の静的お知らせ)
// ============================================================
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { getActingUser } from "@/lib/dal";
import { NEWS } from "@/lib/news";

export default async function NewsPage() {
  const acting = await getActingUser();
  if (!acting) redirect("/login");
  if (acting.actingUser.role === "admin") redirect("/admin");

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "お知らせ" }]} />
      <div className="list-head">
        <div className="list-head-l"><Icons.bell size={20} /><h2>お知らせ</h2><span className="count-badge">{NEWS.length}件</span></div>
      </div>
      {NEWS.length === 0 ? (
        <div className="empty"><Icons.bell size={28} /><p>お知らせはありません</p></div>
      ) : (
        <div className="news-list">
          {NEWS.map((n) => (
            <article className="news-item" key={n.id}>
              <div className="news-meta">
                <span className="news-date">{n.date}</span>
                <span className={"news-tag" + (n.tag === "メンテナンス" ? " is-warn" : "")}>{n.tag}</span>
              </div>
              <h3 className="news-title">{n.title}</h3>
              <p className="news-body">{n.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
