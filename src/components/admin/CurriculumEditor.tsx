"use client";
// ============================================================
// Manabi LMS — カリキュラムエディタ (ADM-02)
// チャプター・ユニットの作成/編集/削除/並び替え。
// 変更はServer Action経由でDBに保存され、revalidateで再描画される。
// 各要素が独立した処理状態を持ち、操作中はスピナーを表示する。
// ============================================================
import React, { useState, useTransition } from "react";
import { Icons } from "@/components/shared/Icons";
import {
  createChapter, updateChapter, deleteChapter, moveChapter,
  createUnit, updateUnit, deleteUnit, moveUnit,
} from "@/app/admin-actions";
import type { ActionResult, AdminCourseEdit } from "@/lib/types";
import { trackUnsaved } from "@/lib/unsaved";

/**
 * 未保存の変更がある間、ページを離れる操作(リロード・タブ閉じ・アプリ内遷移)に
 * 確認ダイアログを出す。実体は src/lib/unsaved.ts(TopNavのボタン遷移とも連動)。
 */
function useUnsavedWarning(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    return trackUnsaved();
  }, [dirty]);
}

export function CurriculumEditor({ course }: { course: AdminCourseEdit }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [newChapter, setNewChapter] = useState("");

  return (
    <div>
      <p className="ed-hint" style={{ margin: "0 0 14px" }}>
        カリキュラムは「基本情報を保存」とは別に、<strong>行ごとに保存</strong>します。
        行を書き換えると右側に「保存」ボタンが現れます(追加・削除・並び替えは押した時点で保存されます)。
      </p>
      {course.chapters.map((ch, ci) => (
        <ChapterEditor key={ch.id} chapter={ch} index={ci} total={course.chapters.length} onError={setErr} />
      ))}

      <div className="ed-add-chapter">
        <div className="fld-in">
          <Icons.layers size={16} />
          <input value={newChapter} onChange={(e) => setNewChapter(e.target.value)} placeholder="新しいチャプター名(例: Chapter 02 — 応用編)" />
        </div>
        <button className="btn-ghost" disabled={pending} onClick={() => {
          setErr("");
          start(async () => {
            const res = await createChapter(course.id, newChapter);
            if (res.ok) setNewChapter("");
            else setErr(res.error);
          });
        }}>
          {pending ? <><span className="spinner sm" />追加中…</> : <><Icons.plus size={15} />チャプター追加</>}
        </button>
      </div>
      {err && <div className="form-err" style={{ marginTop: 12 }}><Icons.x size={15} />{err}</div>}
      <p className="ed-hint">ユニットの動画は YouTube の動画ID(またはURL)で指定します。削除すると受講者の完了記録も削除されます。</p>
    </div>
  );
}

function ChapterEditor({ chapter, index, total, onError }: {
  chapter: AdminCourseEdit["chapters"][number];
  index: number;
  total: number;
  onError: (msg: string) => void;
}) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(chapter.title);
  const [nu, setNu] = useState({ title: "", vid: "", min: "" });
  const [addBusy, setAddBusy] = useState(false);
  useUnsavedWarning(title !== chapter.title);

  function run(action: () => Promise<ActionResult>) {
    onError("");
    start(async () => {
      const res = await action();
      if (!res.ok) onError(res.error);
    });
  }

  return (
    <div className="ed-chapter">
      <div className="ed-chapter-head">
        <div className="fld-in">
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {title !== chapter.title && (
          <button className="btn-ghost" disabled={pending} onClick={() => run(() => updateChapter(chapter.id, title))}>
            {pending ? <><span className="spinner sm" />保存中…</> : "保存"}
          </button>
        )}
        <div className="ed-row-btns">
          {pending && title === chapter.title && <span className="spinner sm" style={{ marginRight: 4, color: "var(--brand)" }} />}
          {/* 並び替えはチャプターが2つ以上あるときだけ意味を持つ(1つだけなら出さない) */}
          {total > 1 && <>
            <button className="ed-ibtn" title="上へ移動" aria-label="チャプターを上へ移動" disabled={pending || index === 0} onClick={() => run(() => moveChapter(chapter.id, "up"))}><Icons.chevDown size={17} style={{ transform: "rotate(180deg)" }} /></button>
            <button className="ed-ibtn" title="下へ移動" aria-label="チャプターを下へ移動" disabled={pending || index === total - 1} onClick={() => run(() => moveChapter(chapter.id, "down"))}><Icons.chevDown size={17} /></button>
          </>}
          <button className="ed-ibtn danger" title="チャプターを削除" aria-label="チャプターを削除" disabled={pending} onClick={() => {
            if (confirm(`「${chapter.title}」を削除しますか?\n配下のユニットと受講者の完了記録も削除されます。`)) run(() => deleteChapter(chapter.id));
          }}><Icons.x size={16} /></button>
        </div>
      </div>
      <div className="ed-units">
        {chapter.units.map((u, ui) => (
          <UnitEditor key={u.id} unit={u} index={ui} total={chapter.units.length} onError={onError} />
        ))}
        <div className="ed-add">
          <div className="fld-in"><input value={nu.title} onChange={(e) => setNu({ ...nu, title: e.target.value })} placeholder="新しいユニット名" /></div>
          <div className="fld-in"><input value={nu.vid} onChange={(e) => setNu({ ...nu, vid: e.target.value })} placeholder="YouTube動画ID / URL" /></div>
          <div className="fld-in">
            <input type="number" min={1} value={nu.min} onChange={(e) => setNu({ ...nu, min: e.target.value })} placeholder="20" inputMode="numeric" title="学習時間目安(分)" />
            <span className="fld-suffix">分</span>
          </div>
          <button className="btn-ghost" disabled={pending} onClick={() => {
            onError("");
            setAddBusy(true);
            start(async () => {
              const res = await createUnit(chapter.id, { title: nu.title, youtubeVideoId: nu.vid, estimatedMinutes: Number(nu.min) });
              if (res.ok) setNu({ title: "", vid: "", min: "" });
              else onError(res.error);
              setAddBusy(false);
            });
          }}>
            {addBusy ? <><span className="spinner sm" />追加中…</> : <><Icons.plus size={15} />追加</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitEditor({ unit, index, total, onError }: {
  unit: AdminCourseEdit["chapters"][number]["units"][number];
  index: number;
  total: number;
  onError: (msg: string) => void;
}) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: unit.title, vid: unit.youtubeVideoId, min: String(unit.estimatedMinutes) });
  const dirty = form.title !== unit.title || form.vid !== unit.youtubeVideoId || form.min !== String(unit.estimatedMinutes);
  useUnsavedWarning(dirty);

  function run(action: () => Promise<ActionResult>) {
    onError("");
    start(async () => {
      const res = await action();
      if (!res.ok) onError(res.error);
    });
  }

  return (
    <div className="ed-unit">
      <div className="fld-in"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="fld-in"><input value={form.vid} onChange={(e) => setForm({ ...form, vid: e.target.value })} title="YouTube動画ID" /></div>
      <div className="fld-in">
        <input type="number" min={1} value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} inputMode="numeric" title="学習時間目安(分)" />
        <span className="fld-suffix">分</span>
      </div>
      <div className="ed-row-btns">
        {pending && <span className="spinner sm" style={{ marginRight: 4, color: "var(--brand)" }} />}
        {dirty && !pending && (
          <button className="ed-save-btn" title="この行の変更を保存"
            onClick={() => run(() => updateUnit(unit.id, { title: form.title, youtubeVideoId: form.vid, estimatedMinutes: Number(form.min) }))}>
            <Icons.check size={14} />保存
          </button>
        )}
        {/* 並び替えはユニットが2つ以上あるときだけ表示(1つだけなら意味がない) */}
        {total > 1 && <>
          <button className="ed-ibtn" title="上へ移動" aria-label="ユニットを上へ移動" disabled={pending || index === 0} onClick={() => run(() => moveUnit(unit.id, "up"))}><Icons.chevDown size={16} style={{ transform: "rotate(180deg)" }} /></button>
          <button className="ed-ibtn" title="下へ移動" aria-label="ユニットを下へ移動" disabled={pending || index === total - 1} onClick={() => run(() => moveUnit(unit.id, "down"))}><Icons.chevDown size={16} /></button>
        </>}
        <button className="ed-ibtn danger" title="ユニットを削除" aria-label="ユニットを削除" disabled={pending} onClick={() => {
          if (confirm(`「${unit.title}」を削除しますか?\n受講者の完了記録も削除されます。`)) run(() => deleteUnit(unit.id));
        }}><Icons.x size={15} /></button>
      </div>
    </div>
  );
}
