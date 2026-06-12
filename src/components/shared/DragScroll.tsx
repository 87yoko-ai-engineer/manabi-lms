"use client";
// ============================================================
// 横スクロール可能なコンテナ(UX-6)
// スマホでは指のスワイプで動くが、PCの狭いウィンドウでは
// 「掴んでドラッグ」できないと操作手段が分かりにくいため、
// マウスドラッグでもスクロールできるようにする。
// ============================================================
import React from "react";

export function DragScroll({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ startX: number; startLeft: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || el.scrollWidth <= el.clientWidth) return; // スクロール不要なら何もしない
    drag.current = { startX: e.clientX, startLeft: el.scrollLeft };
    setDragging(true);

    const onMove = (ev: MouseEvent) => {
      if (!drag.current || !ref.current) return;
      ref.current.scrollLeft = drag.current.startLeft - (ev.clientX - drag.current.startX);
    };
    const onUp = () => {
      drag.current = null;
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseDown={onMouseDown}
      style={{ cursor: dragging ? "grabbing" : undefined, userSelect: dragging ? "none" : undefined }}
    >
      {children}
    </div>
  );
}
