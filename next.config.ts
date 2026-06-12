import type { NextConfig } from "next";

// ============================================================
// セキュリティヘッダー(改善提案 M-2 / 非機能要件)
// クリックジャッキング・MIMEスニッフィング・情報漏えいを
// ブラウザ側の防御層で抑止する。アプリ側の認可検証(dal.ts /
// Server Actions)と合わせた多層防御。
// ============================================================

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy の方針:
// - frame-src: YouTube埋め込み(youtube-nocookie.com)のみ許可
// - script-src: Next.js が挿入するインラインスクリプトのため 'unsafe-inline' を許容。
//   開発時はReact Fast Refreshが eval を使うため 'unsafe-eval' も許可(本番では付けない)
// - style-src: テーマカラーの inline style(講座カバーのグラデーション等)のため 'unsafe-inline'
// - フォントは next/font が self 配信、画像はローカルのみなので外部オリジン不要
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'none'", // 他サイトへの iframe 埋め込みを拒否(X-Frame-Options の後継)
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // 旧ブラウザ向けのクリックジャッキング対策(CSP frame-ancestors と同等)
  { key: "X-Frame-Options", value: "DENY" },
  // Content-Type を無視した推測実行(MIMEスニッフィング)を禁止
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 外部サイトへ遷移する際にURLのパス・クエリを送らない(オリジンのみ)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 使っていないブラウザ機能を明示的に無効化
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
