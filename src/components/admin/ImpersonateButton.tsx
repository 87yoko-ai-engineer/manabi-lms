"use client";
// 「受講画面」ボタン: Server Action で viewAs Cookie を設定してなりすまし開始
import React, { useTransition } from "react";
import { Icons } from "@/components/shared/Icons";
import { impersonateStudent } from "@/app/actions";

export function ImpersonateButton({ studentId, variant = "matrix" }: { studentId: string; variant?: "matrix" | "link" }) {
  const [pending, start] = useTransition();
  const onClick = () => start(() => impersonateStudent(studentId));
  if (variant === "link") {
    return (
      <button className="link-btn" disabled={pending} onClick={onClick}>
        {pending ? <><span className="spinner sm" /> 切替中…</> : "受講画面"}
      </button>
    );
  }
  return (
    <button className="mx-imp" disabled={pending} onClick={onClick} title="この受講者として表示">
      {pending ? <><span className="spinner sm" /> 切替中…</> : <>受講画面 <Icons.arrowRight size={14} /></>}
    </button>
  );
}
