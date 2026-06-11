"use client";
// ============================================================
// Manabi LMS — ログイン画面 (AUTH-01 / ERR-01,02,03)
// Auth.js Credentials Provider でDB認証する。
// ============================================================
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Icons } from "@/components/shared/Icons";
import { Avatar } from "@/components/shared/ui";
import { USERS, User } from "@/lib/data";

/** シードデータ共通のデモパスワード(prisma/seed.ts と一致) */
const DEMO_PASSWORD = "demo-pass";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // ERR-03: 必須項目の未入力はフォーム送信前にバリデーション
    if (!email.trim()) { setErr("メールアドレスを入力してください"); return; }
    if (!pw) { setErr("パスワードを入力してください"); return; }

    setBusy(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password: pw,
      redirect: false,
    });
    setBusy(false);

    if (res?.error) {
      // ERR-02: 無効化アカウント / ERR-01: それ以外の認証失敗(意図的に曖昧化)
      setErr(res.code === "inactive"
        ? "このアカウントは無効化されています。管理者にお問い合わせください"
        : "メールアドレスまたはパスワードが正しくありません");
      return;
    }
    // ロール別のホームへ
    const session = await getSession();
    router.push(session?.user.role === "admin" ? "/admin" : "/");
    router.refresh();
  }

  function quick(u: User) {
    setEmail(u.email);
    setPw(DEMO_PASSWORD);
    setErr("");
  }

  return (
    <div className="login-wrap">
      <div className="login-aside">
        <div className="login-brand">
          <span className="brand-mark lg"><Icons.layers size={26} /></span>
          <span className="brand-word lg">Manabi<span className="brand-dot">.</span></span>
        </div>
        <h1 className="login-tag">学びを、<br />一歩ずつ確実に。</h1>
        <p className="login-sub">企業研修向けの動画学習プラットフォーム。割り当てられた講座を、自分のペースで。</p>
        <div className="login-stats">
          <div><b>5</b><span>公開講座</span></div>
          <div><b>14</b><span>ユニット</span></div>
          <div><b>YouTube</b><span>埋め込み視聴</span></div>
        </div>
        <div className="login-deco" aria-hidden="true">
          {[...Array(5)].map((_, i) => <span key={i} style={{ animationDelay: i * 0.4 + "s" }} />)}
        </div>
      </div>
      <div className="login-main">
        <form className="login-card" onSubmit={submit}>
          <h2>ログイン</h2>
          <p className="login-card-sub">メールアドレスとパスワードを入力してください</p>
          <label className="fld">
            <span>メールアドレス</span>
            <div className="fld-in"><Icons.mail size={18} /><input value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@example.com" autoComplete="off" /></div>
          </label>
          <label className="fld">
            <span>パスワード</span>
            <div className="fld-in"><Icons.lock size={18} /><input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} placeholder="••••••••" /></div>
          </label>
          {err && <div className="login-err"><Icons.x size={15} />{err}</div>}
          <button className="btn-primary lg" type="submit" disabled={busy}>
            {busy ? <><span className="spinner" />認証中…</> : <>ログイン<Icons.arrowRight size={18} /></>}
          </button>
          <div className="login-demo">
            <span className="login-demo-label">デモアカウントで試す</span>
            <div className="login-demo-grid">
              {USERS.map((u) => (
                <button type="button" key={u.id} className={"demo-acct" + (u.isActive ? "" : " is-off")} onClick={() => quick(u)}>
                  <Avatar user={u} size={28} />
                  <span className="da-name">{u.name}</span>
                  <span className={"da-role " + (u.role === "admin" ? "is-admin" : "")}>{u.role === "admin" ? "管理者" : u.isActive ? "受講者" : "無効"}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
