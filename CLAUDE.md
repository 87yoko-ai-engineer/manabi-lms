@AGENTS.md

# Manabi LMS — プロジェクトコンテキスト

## これは何か

転職ポートフォリオ用の動画学習プラットフォーム(LMS)。**このフォルダ(`C:\Users\masah\dev\manabi-lms`)が実装の本体**で、唯一のソースコード置き場。

- 公開URL: https://manabi-lms.vercel.app
- GitHub: https://github.com/87yoko-ai-engineer/manabi-lms (Private)
- **masterへのpushで本番へ自動デプロイされる**(Vercel連携済み)。push前にビルドとテストを通すこと

## フォルダの役割分担(重要)

| 場所 | 役割 |
|---|---|
| `C:\Users\masah\dev\manabi-lms`(ここ) | 実装本体。コード変更はすべてここ |
| `C:\Users\masah\OneDrive\デスクトップ\imanyu_lectures\新講座\動画学習プラットフォーム_ダッシュボードLMS` | 資料置き場。要件定義書(`lms-requirements-updated_2.md`)・タスクチェックリスト・デザインプロトタイプ(`lms/project/`)・面接練習ガイド。コードは置かない |

OneDrive外にコードを置いているのは、node_modulesの同期負荷と日本語パスのツール互換性を避けるため。

## 技術構成

- Next.js (App Router) / TypeScript / React 19 — Server Components + Server Actions
- DB: Neon PostgreSQL(`main`=本番 / `development`=開発ブランチ。ローカルの `.env` はdevelopment向き)
- ORM: Prisma **v6**(v7は破壊的変更が多く意図的に不採用)
- 認証: Auth.js v5 Credentials + bcrypt。`src/proxy.ts`(Next16の旧middleware)でアクセス制御
- スタイル: `globals.css` のデザイントークン+素のCSS(**Tailwind不使用**。Claude Designプロトタイプから移植したクラス名を維持)
- テスト: Vitest(`npm test`)

## よく使うコマンド

```bash
npm run dev      # 開発サーバー(localhost:3000)
npm test         # ユニットテスト(進捗集計・期間判定)
npx next build   # 型チェック込みビルド(push前に必ず)
npm run seed     # デモデータ再投入(全削除→再作成、冪等)
```

## 設計の要点(変更時に守ること)

- **データアクセスは `src/lib/dal.ts` に集約**(Server Components/Actionsから呼ぶ。認可チェックもここ)
- **Server Actionsは必ずサーバー側で権限検証**(`requireAdmin` 等。クライアント制御に依存しない)
- サーバー→クライアントは `src/lib/types.ts` のDTO型(プレーンオブジェクト、日付は文字列)
- 期間判定は `src/lib/access.ts`(JST実日付・開始/終了日とも当日を含む)。変更したらテストも更新
- なりすまし(管理者の受講者ビュー)はhttpOnly Cookie `viewAs`
- 受講者は原則論理削除(`isActive=false`)。物理削除は誤登録・消去請求向けの第二手段
- 全ボタンは「押下中スピナー+状態ラベル」のUXで統一(`.spinner` クラス)
- デモアカウント: 全員パスワード `demo-pass`(admin@example.com / sato@example.com 等、READMEに一覧)

## ユーザー(開発者)について

経理20年(簿記1級)からのキャリア転換でAI開発を学習中。コードは「読んで説明できる」ことを重視しているので、**変更時は何をなぜ変えたかを平易に説明し、設計判断の理由を言語化すること**。要件定義書のID(STU-01, ADM-04, ERR-07など)と対応づけると喜ばれる。
