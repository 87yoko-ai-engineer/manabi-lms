// ============================================================
// Manabi LMS — 進捗集計・期間判定のユニットテスト (Session 4)
// 実行: npm test
// ============================================================
import { describe, it, expect } from "vitest";
import { accessOf, computePct, statusOf, fmtDate } from "./access";

const D = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const NOW = D(2026, 6, 10); // デモ基準日

describe("computePct(進捗率 = 完了ユニット数 ÷ 全ユニット数)", () => {
  it("0ユニットなら0%(ゼロ除算しない)", () => {
    expect(computePct(0, 0)).toBe(0);
  });
  it("未着手は0%", () => {
    expect(computePct(0, 3)).toBe(0);
  });
  it("一部完了は四捨五入(2/3 → 67%)", () => {
    expect(computePct(2, 3)).toBe(67);
  });
  it("全完了は100%", () => {
    expect(computePct(3, 3)).toBe(100);
  });
});

describe("statusOf(STU-07: 未着手0% / 受講中1〜99% / 修了100%)", () => {
  it.each([
    [0, "none"],
    [1, "active"],
    [99, "active"],
    [100, "done"],
  ] as const)("%i%% → %s", (pct, expected) => {
    expect(statusOf(pct)).toBe(expected);
  });
});

describe("accessOf(STU-08 / ERR-07,08: 公開期間・受講期間の判定)", () => {
  const publish = { publishStart: D(2026, 4, 1), publishEnd: D(2027, 3, 31) };
  const enrollment = { enrollStart: D(2026, 4, 15), enrollEnd: D(2026, 12, 15) };

  it("公開中かつ受講期間内なら視聴可", () => {
    const a = accessOf({ ...publish, enrollment }, NOW);
    expect(a.viewable).toBe(true);
    expect(a.label).toBeNull();
  });

  it("ERR-07: 公開開始前は「公開期間外」(期間をメッセージに含む)", () => {
    const a = accessOf({ publishStart: D(2026, 7, 1), publishEnd: D(2027, 6, 30), enrollment }, NOW);
    expect(a.viewable).toBe(false);
    expect(a.label).toBe("公開期間外");
    expect(a.msg).toContain("2026/07/01 〜 2027/06/30");
  });

  it("ERR-07: 公開終了後も「公開期間外」", () => {
    const a = accessOf({ publishStart: D(2025, 1, 1), publishEnd: D(2026, 1, 1), enrollment: null }, NOW);
    expect(a.viewable).toBe(false);
    expect(a.label).toBe("公開期間外");
  });

  it("ERR-08: 受講期間終了後は「受講期間外」", () => {
    const a = accessOf({ ...publish, enrollment: { enrollStart: D(2026, 1, 1), enrollEnd: D(2026, 5, 31) } }, NOW);
    expect(a.viewable).toBe(false);
    expect(a.label).toBe("受講期間外");
    expect(a.msg).toContain("2026/01/01 〜 2026/05/31");
  });

  it("受講開始前は「受講開始前」", () => {
    const a = accessOf({ ...publish, enrollment: { enrollStart: D(2026, 8, 1), enrollEnd: D(2026, 12, 31) } }, NOW);
    expect(a.viewable).toBe(false);
    expect(a.label).toBe("受講開始前");
  });

  it("公開期間外の判定は受講期間より優先される", () => {
    const a = accessOf({
      publishStart: D(2026, 7, 1), publishEnd: D(2027, 6, 30),
      enrollment: { enrollStart: D(2026, 1, 1), enrollEnd: D(2026, 5, 31) },
    }, NOW);
    expect(a.label).toBe("公開期間外");
  });

  it("受講割当がない場合は公開期間のみで判定", () => {
    const a = accessOf({ ...publish, enrollment: null }, NOW);
    expect(a.viewable).toBe(true);
  });

  it("境界値: 公開開始日当日・終了日当日は視聴可", () => {
    expect(accessOf({ ...publish, enrollment: null }, D(2026, 4, 1)).viewable).toBe(true);
    expect(accessOf({ ...publish, enrollment: null }, D(2027, 3, 31)).viewable).toBe(true);
  });
});

describe("fmtDate", () => {
  it("UTC midnight の Date を YYYY/MM/DD に整形", () => {
    expect(fmtDate(D(2026, 4, 1))).toBe("2026/04/01");
  });
});
