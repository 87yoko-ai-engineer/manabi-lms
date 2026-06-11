"use client";
// ============================================================
// Manabi LMS — 受講者アカウントの発行・編集フォーム (ADM-03 / AUTH-05)
// 編集時のパスワードは「入力した場合のみ上書き」(パスワードリセットの運用代替)
// ============================================================
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/shared/Icons";
import { createStudent, updateStudent, StudentInput } from "@/app/admin-actions";
import type { UiUser } from "@/lib/types";

export function UserForm({ user }: { user?: UiUser }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<StudentInput>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    isActive: user?.isActive ?? true,
  });

  function set<K extends keyof StudentInput>(k: K, v: StudentInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErr("");
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = user ? await updateStudent(user.id, form) : await createStudent(form);
      if (!res.ok) { setErr(res.error); return; }
      if (user) {
        setSaved(true);
        setForm((f) => ({ ...f, password: "" }));
      } else {
        router.push(`/admin/users/${res.id}/enrollments`); // 発行後はそのまま講座割り当てへ
      }
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="aform-grid">
        <label className="fld">
          <span>氏名 *</span>
          <div className="fld-in"><Icons.users size={17} /><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="例: 山田 花子" /></div>
        </label>
        <label className="fld">
          <span>メールアドレス *</span>
          <div className="fld-in"><Icons.mail size={17} /><input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="user@example.com" autoComplete="off" /></div>
        </label>
        <label className="fld">
          <span>{user ? "新しいパスワード(変更する場合のみ・8文字以上)" : "初期パスワード *(8文字以上)"}</span>
          <div className="fld-in"><Icons.lock size={17} /><input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" autoComplete="new-password" /></div>
        </label>
        {user && (
          <label className="fld">
            <span>アカウント状態</span>
            <div className="fld-in">
              <select value={form.isActive ? "1" : "0"} onChange={(e) => set("isActive", e.target.value === "1")}>
                <option value="1">有効</option>
                <option value="0">無効(ログイン不可・進捗は保持)</option>
              </select>
            </div>
          </label>
        )}
      </div>

      <div className="form-foot">
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? <><span className="spinner" />保存中…</> : user ? <><Icons.check size={17} />保存</> : <><Icons.plus size={17} />受講者を発行</>}
        </button>
        <button className="btn-ghost" type="button" disabled={pending} onClick={() => router.push("/admin/users")}>
          キャンセル
        </button>
        {err && <div className="form-err"><Icons.x size={15} />{err}</div>}
        {saved && <div className="form-ok"><Icons.checkCircle size={15} />保存しました</div>}
      </div>
    </form>
  );
}
