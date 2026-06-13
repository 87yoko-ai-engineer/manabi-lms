"use client";
// 講座削除ボタン(確認ダイアログ付き)
import React, { useState, useTransition } from "react";
import { deleteCourse } from "@/app/admin-actions";

export function DeleteCourseButton({ courseId, title }: { courseId: string; title: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <>
      <button className="link-btn danger" disabled={pending} onClick={() => {
        if (confirm(`「${title}」を削除しますか?\n配下のチャプター・ユニット・受講割当・完了記録もすべて削除されます。`)) {
          setErr("");
          start(async () => {
            const res = await deleteCourse(courseId);
            if (!res.ok) setErr(res.error); // M-3: 削除失敗の理由を握りつぶさず表示する
          });
        }
      }}>
        {pending ? <><span className="spinner sm" /> 削除中…</> : "削除"}
      </button>
      {err && <span style={{ color: "#C92A2A", fontSize: 11.5, fontWeight: 600 }}>{err}</span>}
    </>
  );
}
