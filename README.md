# Manabi LMS — 動画学習プラットフォーム

転職ポートフォリオ用の動画学習プラットフォーム(LMS)デモアプリケーション。
企業研修向けに「管理者が講座を割り当て、受講者がYouTube動画で学習し、進捗を記録する」流れを実装する。

**🌐 公開URL: https://manabi-lms.vercel.app**

> **ステータス: MVP完成(チェックリスト Session 1〜10 完了)**
> 認証(Auth.js + bcrypt)・DB(Neon + Prisma)・進捗記録(Server Actions)・
> 管理CRUD(講座/カリキュラム/受講者/割り当て)まで全機能がDB接続で動作し、
> Vercel本番環境にデプロイ済み。

## 技術構成

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Next.js (App Router) / TypeScript / React 19(Server Components + Server Actions) |
| データベース | Neon (PostgreSQL 17)。`main`=本番 / `development`=開発でブランチ分離 |
| ORM | Prisma v6(スキーマ = 設計ドキュメント、マイグレーション管理) |
| 認証 | Auth.js v5 Credentials Provider + bcrypt。JWTにロール格納、proxy(旧middleware)でアクセス制御 |
| スタイリング | グローバルCSS(デザイントークン + CSS変数。Claude Designプロトタイプから移植) |
| フォント | Noto Sans JP / Zen Kaku Gothic New / Outfit (`next/font/google`) |
| 動画 | YouTube 埋め込み(youtube-nocookie.com) |
| テスト | Vitest(進捗集計・期間判定ロジック) |
| ホスティング | Vercel(本番: Neon `main` ブランチ / ローカル開発: `development` ブランチ) |

## 起動方法

```bash
npm install
# .env に DATABASE_URL(Neon接続文字列)と AUTH_SECRET を設定
npx prisma migrate dev   # テーブル作成
npm run seed             # デモデータ投入(再実行可能)
npm run dev
# → http://localhost:3000
```

テスト実行: `npm test`

## デモアカウント

ログイン画面の「デモアカウントで試す」から選択可能(共通パスワード: `demo-pass`、ボタンで自動入力)。

| アカウント | メール | 状態 |
|---|---|---|
| 管理者 太郎(管理者) | admin@example.com | ダッシュボード・講座管理・受講者管理 |
| 佐藤 美咲 | sato@example.com | 講座1修了・講座2受講中・講座4は公開期間外 |
| 鈴木 健一 | suzuki@example.com | 講座1〜3修了 |
| 田中 陽子 | tanaka@example.com | 受講期間終了(受講期間外バッジのデモ) |
| 高橋 大輔 | takahashi@example.com | 無効アカウント(ログイン拒否のデモ) |
| 渡辺 さくら | watanabe@example.com | 全講座修了 |

## 画面構成

| パス | 画面 | ロール |
|---|---|---|
| `/login` | ログイン(デモアカウント選択付き) | 共通 |
| `/` | 講座一覧 + 修了サマリー + 検索・絞り込み(URLクエリ保持) | 受講者 |
| `/courses/[id]` | 講座詳細(チャプター → ユニット階層・進捗リング) | 受講者 |
| `/courses/[id]/units/[unitId]` | 動画視聴 + 完了ボタン | 受講者 |
| `/admin` | 進捗ダッシュボード(KPI・講座別修了率・進捗マトリクス) | 管理者 |
| `/admin/courses` | 講座管理(CRUDは次フェーズで実体化) | 管理者 |
| `/admin/users` | 受講者管理 + なりすまし(受講画面表示) | 管理者 |

その他: 公開期間外・受講期間外講座のロック表示(ERR-07/08)、右下のTweaksパネルで
ブランドカラー・講座一覧レイアウト・余白密度を切り替え可能。

## 設計メモ

- `prisma/schema.prisma` — ER図準拠の6テーブル。複合ユニーク制約(二重割当・二重完了防止)とカスケード削除方針
- `prisma/seed.ts` — `src/lib/data.ts` のデモデータを単一の真実としてDBへ投入(冪等)
- `src/lib/dal.ts` — データアクセス層。セッション検証・なりすまし解決(httpOnly Cookie)・DTO組み立てをサーバー側で実施
- `src/app/actions.ts` — Server Actions(完了トグル・なりすまし)。認可と期間チェックをサーバー側で必ず検証
- `src/lib/access.ts` — 公開期間/受講期間判定・進捗率計算の純粋関数(Vitestでテスト)。デモ基準日 `NOW = 2026/06/10` 固定
- `src/auth.ts` / `src/auth.config.ts` — Auth.js本体とedge対応共通設定の分離(proxyからPrismaを参照しないため)
- Tweaksパネル(配色等)のみ意図的にlocalStorage(ユーザー個人のデザイン検討用設定のため)

要件定義書・タスクチェックリストはプロジェクト資料フォルダ(`動画学習プラットフォーム_ダッシュボードLMS/`)を参照。
