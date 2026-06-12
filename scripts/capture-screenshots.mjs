// ============================================================
// README用スクリーンショットの自動撮影(モバイル375px幅)
//
// 使い方:
//   1. 別ターミナルで npm run dev(localhost:3000)を起動しておく
//   2. node scripts/capture-screenshots.mjs
//   → docs/screenshots/mobile-*.png が更新される
//
// puppeteer-core はインストール済みのブラウザ(既定: Edge)を操作する。
// ブラウザの場所が違う場合は環境変数 BROWSER_PATH で指定する。
// ============================================================
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const BROWSER =
  process.env.BROWSER_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = "docs/screenshots";

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true });
const page = await browser.newPage();
// iPhone相当の幅。deviceScaleFactor:2 で文字がくっきり写る
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

async function shot(name) {
  await new Promise((r) => setTimeout(r, 600)); // フォント・画像の描画待ち
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${OUT}/${name}.png`);
}

/** デモアカウントのボタンをクリックしてログイン(ワンクリックログイン) */
async function loginAs(nameText, expectPath) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button.demo-acct")].find((e) => e.textContent.includes(t));
    b.click();
  }, nameText);
  await page.waitForFunction((p) => location.pathname === p, { timeout: 20000 }, expectPath);
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 20000 });
}

async function logout() {
  await page.evaluate(() => document.querySelector('header button[title="ログアウト"]')?.click());
  await page.waitForFunction(() => location.pathname === "/login", { timeout: 20000 });
}

// 1. ログイン画面
await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
await shot("mobile-login");

// 2. 受講者ホーム(講座一覧)
await loginAs("佐藤", "/");
await shot("mobile-student-home");

// 3. 動画視聴ページ
await page.goto(`${BASE}/courses/c-1/units/un-1-1-1`, { waitUntil: "networkidle0" });
await shot("mobile-unit-view");

// 4. 管理ダッシュボード
await logout();
await loginAs("管理者", "/admin");
await shot("mobile-admin-dashboard");

await browser.close();
console.log("完了");
