"use client";
// 受講者の物理削除ボタン(影響範囲を数字で見せる確認ダイアログ付き)
// 通常の退会処理は「無効化」を使う。削除は誤登録・テストユーザー・消去請求向け。
import React, { useState, useTransition } from "react";
import { deleteStudent } from "@/app/admin-actions";

export function DeleteStudentButton({ userId, name, enrollCount, progressCount }: {
  userId: string;
  name: string;
  enrollCount: number;
  progressCount: number;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function onClick() {
    const msg =
      `「${name}」を完全に削除しますか?\n\n` +
      `以下のデータもすべて削除され、元に戻せません:\n` +
      `・講座の割当 ${enrollCount} 件\n` +
      `・ユニットの完了記録 ${progressCount} 件\n\n` +
      `退職・利用停止の場合は、削除ではなく「編集 > 無効」を使ってください(履歴が保持されます)。`;
    if (!confirm(msg)) return;
    setErr("");
    start(async () => {
      const res = await deleteStudent(userId);
      if (!res.ok) setErr(res.error);
    });
  }

  return (
    <>
      <button className="link-btn danger" disabled={pending} onClick={onClick}>
        {pending ? <><span className="spinner sm" /> 削除中…</> : "削除"}
      </button>
      {err && <span style={{ color: "#C92A2A", fontSize: 11.5, fontWeight: 600 }}>{err}</span>}
    </>
  );
}
