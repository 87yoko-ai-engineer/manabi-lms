"use client";
// 講座削除ボタン(確認ダイアログ付き)
import React, { useTransition } from "react";
import { deleteCourse } from "@/app/admin-actions";

export function DeleteCourseButton({ courseId, title }: { courseId: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button className="link-btn danger" disabled={pending} onClick={() => {
      if (confirm(`「${title}」を削除しますか?\n配下のチャプター・ユニット・受講割当・完了記録もすべて削除されます。`)) {
        start(() => deleteCourse(courseId).then(() => {}));
      }
    }}>
      {pending ? <><span className="spinner sm" /> 削除中…</> : "削除"}
    </button>
  );
}
