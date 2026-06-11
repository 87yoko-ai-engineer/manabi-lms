"use client";
// ============================================================
// Manabi LMS — 講座一覧(ホーム) STU-01,02,06,07,08
// 検索条件はURLクエリで保持(共有・リロード耐性)
// ============================================================
import React, { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { SummaryCard, CourseCard, SearchSidebar, StatusKey } from "@/components/student/cards";
import { useApp } from "@/components/providers/AppProvider";
import { enrolledCourses, courseTotalMinutes, Course } from "@/lib/data";
import { accessOf, pctOf, statusOf } from "@/lib/access";

function HomeContent() {
  const { actingUser, progressOf, tweaks } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  if (!actingUser) return null;

  const q = params.get("q") ?? "";
  const statusFilter = (params.get("status") as StatusKey) ?? "all";
  const cat = params.get("cat");

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.size ? `/?${next}` : "/", { scroll: false });
  }

  const courses = enrolledCourses(actingUser.id);
  const done = progressOf(actingUser.id);
  const pf = (c: Course) => pctOf(c, done);
  const categories = useMemo(() => [...new Set(courses.map((c) => c.category))], [courses]);

  const counts: Record<StatusKey, number> = { all: courses.length, none: 0, active: 0, done: 0 };
  courses.forEach((c) => { counts[statusOf(pf(c))]++; });

  const filtered = courses.filter((c) => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && c.category !== cat) return false;
    if (statusFilter !== "all" && statusOf(pf(c)) !== statusFilter) return false;
    return true;
  });

  function clear() { router.replace("/", { scroll: false }); }

  return (
    <div className="page">
      <Breadcrumb items={[{ label: "ホーム" }, { label: "講座一覧" }]} />
      <div className="home-grid">
        <main className="home-main">
          <SummaryCard courses={courses} pctOf={pf} />
          <div className="list-head">
            <div className="list-head-l"><Icons.book size={20} /><h2>講座一覧</h2><span className="count-badge">{filtered.length}件</span></div>
          </div>
          {filtered.length === 0 && (
            <div className="empty"><Icons.search size={28} /><p>条件に一致する講座がありません</p><button className="btn-ghost" onClick={clear}>条件をクリア</button></div>
          )}
          <div className={"ccard-list " + (tweaks.layout === "card" ? "as-cards" : "")}>
            {filtered.map((c) => (
              <CourseCard key={c.id} course={c} pct={pf(c)} minutes={courseTotalMinutes(c)}
                access={accessOf(c, actingUser.id)} layout={tweaks.layout}
                onOpen={() => router.push(`/courses/${c.id}`)} />
            ))}
          </div>
        </main>
        <SearchSidebar
          q={q} setQ={(v) => setParam("q", v || null)}
          statusFilter={statusFilter} setStatusFilter={(v) => setParam("status", v === "all" ? null : v)}
          cat={cat} setCat={(v) => setParam("cat", v)}
          categories={categories} onClear={clear} counts={counts} />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
