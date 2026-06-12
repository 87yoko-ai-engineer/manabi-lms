"use client";
// ============================================================
// Manabi LMS — 日付選択フィールド(UX-12)
// ブラウザ標準の <input type="date"> は年・月の部分を手入力でしか
// 直せず入力事故(例: 0020年)が起きやすいため、
// 「年・月はプルダウン、日はカレンダーのマス目をクリック」で
// マウスだけで選べる自作ピッカーに置き換える。
// 値の形式は従来と同じ "YYYY-MM-DD"(空文字 = 未選択)。
// ============================================================
import React from "react";
import { Icons } from "./Icons";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function DateField({ value, onChange, yearRange }: {
  /** "YYYY-MM-DD" または ""(未選択) */
  value: string;
  onChange: (v: string) => void;
  /** 選択できる年の範囲。省略時は 今年-2 〜 今年+6 */
  yearRange?: [number, number];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const today = new Date();
  const [minYear, maxYear] = yearRange ?? [today.getFullYear() - 2, today.getFullYear() + 6];

  // カレンダーに表示中の年月(選択済みならその月、未選択なら今月から)
  const [ym, setYm] = React.useState(() =>
    parsed ? { y: Number(parsed[1]), m: Number(parsed[2]) } : { y: today.getFullYear(), m: today.getMonth() + 1 },
  );

  // ポップアップの外側をクリックしたら閉じる
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggle() {
    if (parsed) setYm({ y: Number(parsed[1]), m: Number(parsed[2]) }); // 開くたびに選択中の月へ戻す
    setOpen((v) => !v);
  }

  const daysInMonth = new Date(ym.y, ym.m, 0).getDate();
  const firstWeekday = new Date(ym.y, ym.m - 1, 1).getDay();
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  return (
    <div className="datef" ref={ref}>
      <button type="button" className="datef-btn" onClick={toggle} aria-expanded={open} aria-label="日付を選択">
        <Icons.calendar size={15} />
        <span className={value ? undefined : "datef-empty"}>{value ? value.replaceAll("-", "/") : "日付を選択"}</span>
        <Icons.chevDown size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
      </button>
      {open && (
        <div className="datef-pop">
          <div className="datef-head">
            <select value={ym.y} onChange={(e) => setYm({ ...ym, y: Number(e.target.value) })} aria-label="年">
              {years.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={ym.m} onChange={(e) => setYm({ ...ym, m: Number(e.target.value) })} aria-label="月">
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}
            </select>
          </div>
          <div className="datef-grid">
            {WEEKDAYS.map((w) => <span key={w} className="datef-wd">{w}</span>)}
            {Array.from({ length: firstWeekday }, (_, i) => <span key={"pad" + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const v = `${ym.y}-${pad2(ym.m)}-${pad2(d)}`;
              return (
                <button
                  type="button"
                  key={d}
                  className={"datef-day" + (v === value ? " is-sel" : "") + (v === todayStr ? " is-today" : "")}
                  onClick={() => { onChange(v); setOpen(false); }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
