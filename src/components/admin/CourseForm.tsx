"use client";
// ============================================================
// Manabi LMS — 講座の基本情報フォーム (ADM-01)
// 新規作成と編集の両方で使う
// ============================================================
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/shared/Icons";
import { createCourse, updateCourse, CourseInput } from "@/app/admin-actions";
import type { AdminCourseEdit } from "@/lib/types";

const ACCENTS = ["#3B5BDB", "#1098AD", "#0CA678", "#E8590C", "#6741D9"];

const EMPTY: CourseInput = {
  title: "", subtitle: "", category: "", tag: "任意", description: "",
  goals: [], publishStart: "", publishEnd: "", accent: ACCENTS[0], coverLabel: "",
};

export function CourseForm({ course }: { course?: AdminCourseEdit }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<CourseInput>(
    course
      ? {
          title: course.title, subtitle: course.subtitle, category: course.category,
          tag: course.tag, description: course.description, goals: course.goals,
          publishStart: course.publishStart, publishEnd: course.publishEnd,
          accent: course.accent, coverLabel: course.coverLabel,
        }
      : EMPTY,
  );

  function set<K extends keyof CourseInput>(k: K, v: CourseInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErr("");
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = course ? await updateCourse(course.id, form) : await createCourse(form);
      if (!res.ok) { setErr(res.error); return; }
      if (course) {
        setSaved(true);
      } else {
        router.push(`/admin/courses/${res.id}`); // 作成後はカリキュラム編集へ
      }
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="aform-grid">
        <label className="fld">
          <span>タイトル *</span>
          <div className="fld-in"><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="例: AI時代に必須 APIとは?" /></div>
        </label>
        <label className="fld">
          <span>サブタイトル</span>
          <div className="fld-in"><input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="例: 世界一わかりやすく解説" /></div>
        </label>
        <label className="fld">
          <span>カテゴリ *</span>
          <div className="fld-in"><input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="例: AIコーディング" /></div>
        </label>
        <label className="fld">
          <span>区分</span>
          <div className="fld-in">
            <select value={form.tag} onChange={(e) => set("tag", e.target.value)}>
              <option value="必須">必須</option>
              <option value="任意">任意</option>
            </select>
          </div>
        </label>
        <label className="fld span-2">
          <span>説明</span>
          <div className="fld-in"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="講座の概要" /></div>
        </label>
        <label className="fld span-2">
          <span>学習ゴール(改行区切り)</span>
          <div className="fld-in"><textarea value={form.goals.join("\n")} onChange={(e) => set("goals", e.target.value.split("\n"))} placeholder={"APIの基本概念を理解する\nAPIキーを取得できる"} /></div>
        </label>
        <label className="fld">
          <span>公開開始日 *</span>
          <div className="fld-in"><input type="date" value={form.publishStart} onChange={(e) => set("publishStart", e.target.value)} /></div>
        </label>
        <label className="fld">
          <span>公開終了日 *</span>
          <div className="fld-in"><input type="date" value={form.publishEnd} onChange={(e) => set("publishEnd", e.target.value)} /></div>
        </label>
        <div className="fld">
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 7 }}>テーマカラー</span>
          <div className="sw-row">
            {ACCENTS.map((a) => (
              <button type="button" key={a} className={"tw-sw" + (form.accent === a ? " is-on" : "")} style={{ background: a }} onClick={() => set("accent", a)} />
            ))}
            <span
              className="cover-preview"
              style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${form.accent} 80%, #000) 0%, ${form.accent} 55%, color-mix(in srgb, ${form.accent} 65%, #fff) 100%)`, marginLeft: 10 }}
            >
              {form.coverLabel || "?"}
            </span>
          </div>
        </div>
        <label className="fld">
          <span>カバーラベル(2〜3文字)</span>
          <div className="fld-in"><input value={form.coverLabel} onChange={(e) => set("coverLabel", e.target.value)} placeholder="例: API" maxLength={4} /></div>
        </label>
      </div>

      <div className="form-foot">
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "保存中..." : course ? <><Icons.check size={17} />基本情報を保存</> : <><Icons.plus size={17} />講座を作成</>}
        </button>
        <button className="btn-ghost" type="button" disabled={pending} onClick={() => router.push("/admin/courses")}>
          キャンセル
        </button>
        {err && <div className="form-err"><Icons.x size={15} />{err}</div>}
        {saved && <div className="form-ok"><Icons.checkCircle size={15} />保存しました</div>}
      </div>
    </form>
  );
}
