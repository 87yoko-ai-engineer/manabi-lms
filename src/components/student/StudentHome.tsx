"use client";
// ============================================================
// Manabi LMS — 講座一覧の検索・絞り込みUI (STU-06,07)
// データはサーバーから受け取り、検索条件はURLクエリで保持する
// ============================================================
import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { SummaryCard, CourseCard, SearchSidebar, StatusKey } from "@/components/student/cards";
import { useTweaks } from "@/components/providers/TweaksProvider";
import { statusOf } from "@/lib/access";
import type { CourseListItem } from "@/lib/types";

export function StudentHome({ courses }: { courses: CourseListItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { tweaks } = useTweaks();
  // UX-3: モバイルでは検索パネルを折りたたみ、講座一覧を先に見せる
  const [searchOpen, setSearchOpen] = React.useState(false);

  const q = params.get("q") ?? "";
  const statusFilter = (params.get("status") as StatusKey) ?? "all";
  const cat = params.get("cat");
  // 適用中の絞り込み数(モバイルの折りたたみボタンにバッジ表示する)
  const activeFilters = (q ? 1 : 0) + (cat ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.size ? `/?${next}` : "/", { scroll: false });
  }

  const categories = useMemo(() => [...new Set(courses.map((c) => c.category))], [courses]);

  const counts: Record<StatusKey, number> = { all: courses.length, none: 0, active: 0, done: 0 };
  courses.forEach((c) => { counts[statusOf(c.pct)]++; });

  const filtered = courses.filter((c) => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && c.category !== cat) return false;
    if (statusFilter !== "all" && statusOf(c.pct) !== statusFilter) return false;
    return true;
  });

  function clear() { router.replace("/", { scroll: false }); }

  // M-6: 講座が1つも割り当てられていない場合は、検索や集計を出しても
  // 意味がないため、状況の説明だけの画面にする(「壊れている?」と不安にさせない)
  if (courses.length === 0) {
    return (
      <div className="page">
        <Breadcrumb items={[{ label: "ホーム" }, { label: "講座一覧" }]} />
        <div className="empty" style={{ paddingTop: 70, paddingBottom: 70 }}>
          <Icons.book size={34} />
          <p style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-2)" }}>受講できる講座がまだありません</p>
          <p style={{ fontSize: 13, color: "var(--ink-4)", maxWidth: 360, lineHeight: 1.7 }}>
            講座は管理者が割り当てると、ここに表示されます。
            しばらく経っても表示されない場合は、管理者にお問い合わせください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "ホーム" }, { label: "講座一覧" }]} />
      <div className="home-grid">
        <main className="home-main">
          <SummaryCard courses={courses} />
          <div className="list-head">
            <div className="list-head-l"><Icons.book size={20} /><h2>講座一覧</h2><span className="count-badge">{filtered.length}件</span></div>
          </div>
          {filtered.length === 0 && (
            <div className="empty"><Icons.search size={28} /><p>条件に一致する講座がありません</p><button className="btn-ghost" onClick={clear}>条件をクリア</button></div>
          )}
          <div className={"ccard-list " + (tweaks.layout === "card" ? "as-cards" : "")}>
            {filtered.map((c) => (
              <CourseCard key={c.id} course={c} layout={tweaks.layout} onOpen={() => router.push(`/courses/${c.id}`)} />
            ))}
          </div>
        </main>
        <div className={"search-wrap" + (searchOpen ? " is-open" : "")}>
          <button type="button" className="search-toggle" onClick={() => setSearchOpen((v) => !v)} aria-expanded={searchOpen}>
            <Icons.search size={16} />
            <span>検索・絞り込み</span>
            {activeFilters > 0 && <span className="search-toggle-badge">{activeFilters}</span>}
            <Icons.chevDown size={16} style={{ marginLeft: "auto", transform: searchOpen ? "rotate(180deg)" : undefined, transition: ".15s" }} />
          </button>
          <SearchSidebar
            q={q} setQ={(v) => setParam("q", v || null)}
            statusFilter={statusFilter} setStatusFilter={(v) => setParam("status", v === "all" ? null : v)}
            cat={cat} setCat={(v) => setParam("cat", v)}
            categories={categories} onClear={clear} counts={counts} />
        </div>
      </div>
    </div>
  );
}
