// 画面遷移中のローディング表示(サーバーでのデータ取得待ちの間に即時表示される)
export default function Loading() {
  return (
    <div className="page-loading">
      <span className="spinner lg" />
      <span>読み込み中…</span>
    </div>
  );
}
