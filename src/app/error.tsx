"use client";
// ============================================================
// ERR-06: 予期しないサーバーエラー画面(500相当)
// error.tsx は Next.js の Error Boundary。配下のページ・レイアウトで
// 例外が発生するとこの画面に差し替わる(クライアントコンポーネント必須)。
// not-found.tsx(404)とトーンを揃える。
// ============================================================
import { useState } from "react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
      <h1 style={{ fontSize: 64, fontFamily: "var(--num)" }}>500</h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 8 }}>エラーが発生しました</p>
      <p style={{ color: "var(--ink-4)", fontSize: 13, marginBottom: 24 }}>
        時間をおいて再度お試しください。解決しない場合は管理者にお問い合わせください。
      </p>
      <button className="btn-primary" disabled={retrying}
        onClick={() => { setRetrying(true); reset(); }}>
        {retrying ? <><span className="spinner" />再試行中…</> : "再試行する"}
      </button>
    </div>
  );
}
