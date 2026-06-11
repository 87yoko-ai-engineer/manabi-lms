import Link from "next/link";

// ERR-05: 404画面(ホームへのリンク設置)
export default function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", paddingTop: 80 }}>
      <h1 style={{ fontSize: 64, fontFamily: "var(--num)" }}>404</h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>ページが見つかりません</p>
      <Link className="btn-primary" href="/">ホームへ戻る</Link>
    </div>
  );
}
