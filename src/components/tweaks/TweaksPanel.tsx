"use client";
// ============================================================
// Manabi LMS — Tweaksパネル(ブランドカラー/レイアウト/密度の切替)
// ============================================================
import React, { useState } from "react";
import { Icons } from "@/components/shared/Icons";
import { useApp, Tweaks } from "@/components/providers/AppProvider";

const ACCENTS = [
  { v: "#3B5BDB", label: "インディゴ" },
  { v: "#1098AD", label: "ティール" },
  { v: "#0CA678", label: "グリーン" },
  { v: "#E8590C", label: "オレンジ" },
  { v: "#6741D9", label: "パープル" },
];

export function TweaksPanel() {
  const { tweaks, setTweaks } = useApp();
  const [open, setOpen] = useState(false);

  function set<K extends keyof Tweaks>(k: K, v: Tweaks[K]) {
    setTweaks((t) => ({ ...t, [k]: v }));
  }

  return (
    <>
      <button className="tw-fab" onClick={() => setOpen((o) => !o)} title="Tweaks">
        {open ? <Icons.x size={20} /> : <Icons.sparkle size={20} />}
      </button>
      {open && (
        <div className="tw-panel">
          <div className="tw-head"><Icons.sparkle size={16} /><h3>Tweaks</h3><button onClick={() => setOpen(false)}><Icons.x size={16} /></button></div>

          <div className="tw-sec">
            <span className="tw-label">ブランドカラー</span>
            <div className="tw-swatches">
              {ACCENTS.map((a) => (
                <button key={a.v} className={"tw-sw" + (tweaks.accent === a.v ? " is-on" : "")} style={{ background: a.v }} onClick={() => set("accent", a.v)} title={a.label} />
              ))}
            </div>
          </div>

          <div className="tw-sec">
            <span className="tw-label">講座一覧のレイアウト</span>
            <div className="tw-seg">
              {([{ k: "row", l: "リスト" }, { k: "card", l: "カード" }] as const).map((o) => (
                <button key={o.k} className={tweaks.layout === o.k ? "is-on" : ""} onClick={() => set("layout", o.k)}>{o.l}</button>
              ))}
            </div>
          </div>

          <div className="tw-sec">
            <span className="tw-label">余白の密度</span>
            <div className="tw-seg">
              {([{ k: "comfortable", l: "ゆったり" }, { k: "compact", l: "コンパクト" }] as const).map((o) => (
                <button key={o.k} className={tweaks.density === o.k ? "is-on" : ""} onClick={() => set("density", o.k)}>{o.l}</button>
              ))}
            </div>
          </div>

          <p className="tw-note">配色・レイアウトを切り替えて比較できます。</p>
        </div>
      )}
    </>
  );
}
