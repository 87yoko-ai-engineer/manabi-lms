// ============================================================
// 未保存変更の追跡(クライアント専用)
// カリキュラムエディタ等の「行ごと保存」UIで、保存し忘れたまま
// ページを離れて変更が消えるのを防ぐ。
//
// beforeunload はリロード・タブを閉じる操作にしか効かない
// (Next.jsのアプリ内遷移はページ再読み込みではないため発火しない)。
// そこで、
//   - beforeunload: リロード・タブ閉じ用
//   - クリック捕捉: アプリ内リンク(<a>)用。ナビゲーションはUX-4で
//     すべて <Link>(=<a>)に統一したため、この捕捉で全遷移をカバーできる
// の2経路で確認を出す。
// ============================================================

let count = 0;

const MSG = "保存されていない変更があります。このまま移動すると変更は失われます。移動しますか?";

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
}

/** アプリ内リンク(<a href>)のクリックを捕捉して確認する */
function onClickCapture(e: MouseEvent) {
  const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
  if (a && !window.confirm(MSG)) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/**
 * 「未保存の変更が1件ある」と登録する。戻り値の関数で解除。
 * 件数が 0→1 になったときだけリスナーを張り、1→0 で外す
 * (複数の行が同時に未保存でも確認ダイアログは1回にするため)。
 */
export function trackUnsaved(): () => void {
  if (++count === 1) {
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
  }
  let released = false;
  return () => {
    if (released) return; // 二重解除でカウントが狂わないように
    released = true;
    if (--count === 0) {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    }
  };
}
