# Manabi LMS — 動画学習プラットフォーム

転職ポートフォリオ用の動画学習プラットフォーム(LMS)デモアプリケーション。
企業研修向けに「管理者が講座を割り当て、受講者がYouTube動画で学習し、進捗を記録する」流れを実装する。

> **現在のフェーズ: フロントエンド先行実装**
> デザイン・UI・画面遷移・進捗インタラクションを Next.js で実装済み。
> データベース(Prisma + Neon)・認証(Auth.js)は次フェーズで導入予定で、
> 現在はシードデータ相当のモックデータ + localStorage で全画面が動作する。

## 技術構成

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Next.js (App Router) / TypeScript / React 19 |
| スタイリング | グローバルCSS(デザイントークン + CSS変数。Claude Designプロトタイプから移植) |
| フォント | Noto Sans JP / Zen Kaku Gothic New / Outfit (`next/font/google`) |
| 状態管理 | React Context + localStorage(モック認証・進捗の永続化) |
| 動画 | YouTube 埋め込み(youtube-nocookie.com) |
| 今後導入予定 | Prisma + Neon (PostgreSQL) / Auth.js / Vercel |

## 起動方法

```bash
npm install
npm run dev
# → http://localhost:3000
```

## デモアカウント

ログイン画面の「デモアカウントで試す」から選択可能(パスワードは任意の文字列でOK)。

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

## 設計メモ(バックエンド差し替えポイント)

- `src/lib/data.ts` — モックデータ層。型は要件定義書のER図(Prismaスキーマ予定)とフィールド名を一致させており、ここをPrismaクエリに差し替える
- `src/lib/access.ts` — 公開期間/受講期間判定・進捗率計算(デモ基準日 `NOW = 2026/06/10` 固定)
- `src/components/providers/AppProvider.tsx` — モック認証・進捗状態。Auth.js / Server Actions に置換予定

要件定義書・タスクチェックリストはプロジェクト資料フォルダ(`動画学習プラットフォーム_ダッシュボードLMS/`)を参照。
