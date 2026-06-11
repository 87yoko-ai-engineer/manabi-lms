"use client";
// ============================================================
// Manabi LMS — 講座管理 (ADM-01,02) ※CRUD操作はバックエンド導入後に実体化
// ============================================================
import React from "react";
import { Breadcrumb } from "@/components/shared/ui";
import { Icons } from "@/components/shared/Icons";
import { COURSES, courseUnits, courseTotalMinutes } from "@/lib/data";

export default function AdminCoursesPage() {
  return (
    <div className="page">
      <Breadcrumb items={[{ label: "管理" }, { label: "講座管理" }]} />
      <div className="adm-head">
        <div><h1 className="adm-title">講座管理</h1><p className="adm-sub">講座・チャプター・ユニットの作成と編集</p></div>
        <button className="btn-primary"><Icons.plus size={17} />新規講座</button>
      </div>
      <section className="panel">
        <div className="panel-head"><Icons.book size={19} /><h2>講座一覧</h2><span className="count-badge">{COURSES.length}件</span></div>
        <table className="atable">
          <thead><tr><th>講座</th><th>カテゴリ</th><th>区分</th><th>構成</th><th>公開期間</th><th></th></tr></thead>
          <tbody>
            {COURSES.map((c) => {
              const units = courseUnits(c).length;
              return (
                <tr key={c.id}>
                  <td>
                    <div className="at-course">
                      <span className="at-cover" style={{ background: c.cover }}>{c.coverLabel}</span>
                      <div><span className="at-title">{c.title}</span><span className="at-sub">{c.subtitle}</span></div>
                    </div>
                  </td>
                  <td><span className="tag-soft">{c.category}</span></td>
                  <td><span className={"cover-tag sm " + (c.tag === "必須" ? "is-req" : "")}>{c.tag}</span></td>
                  <td className="at-dim">{c.chapters.length}章 / {units}ユニット / 約{courseTotalMinutes(c)}分</td>
                  <td className="at-dim">{c.publishStart}<br />〜 {c.publishEnd}</td>
                  <td className="at-actions"><button className="link-btn">編集</button><button className="link-btn danger">削除</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
