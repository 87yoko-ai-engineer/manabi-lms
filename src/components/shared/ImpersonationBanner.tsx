"use client";
// なりすまし中バナー(管理画面へ戻るとCookieが消える)
import React, { useTransition } from "react";
import { Icons } from "./Icons";
import { stopImpersonation } from "@/app/actions";

export function ImpersonationBanner({ name }: { name: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="imp-banner">
      <span><Icons.users size={16} /><b>{name}</b> として受講画面を表示中</span>
      <button disabled={pending} onClick={() => start(() => stopImpersonation())}>
        {pending ? <><span className="spinner sm" /> 戻っています…</> : <>管理画面に戻る <Icons.arrowRight size={15} /></>}
      </button>
    </div>
  );
}
