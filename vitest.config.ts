// ============================================================
// Vitest 設定
// - "@/..." パスエイリアスを tsconfig.json と一致させる
//   (dal.ts / actions.ts など Server 専用モジュールのテストで必要)
// ============================================================
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
