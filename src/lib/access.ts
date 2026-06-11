// ============================================================
// Manabi LMS — 期間判定・進捗計算ロジック (STU-08 / ERR-07,08 / §4.4)
// DBのDate型を扱う純粋関数。ユニットテスト対象(access.test.ts)。
// ============================================================

/**
 * デモ基準日(シードデータの進捗バリエーションと整合する固定日)。
 * 本番運用に切り替える場合は `new Date()` を返すように変更する。
 */
export const NOW = new Date(Date.UTC(2026, 5, 10));

/** Date → "YYYY/MM/DD"(シードはUTC midnightで保存している) */
export function fmtDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export interface AccessInput {
  publishStart: Date;
  publishEnd: Date;
  enrollment?: { enrollStart: Date; enrollEnd: Date } | null;
}

export interface Access {
  viewable: boolean;
  label: string | null;
  msg: string | null;
}

/** 講座の閲覧可否(公開期間・受講期間)を判定 */
export function accessOf(input: AccessInput, now: Date = NOW): Access {
  const { publishStart, publishEnd, enrollment } = input;
  if (now < publishStart || now > publishEnd) {
    return {
      viewable: false,
      label: "公開期間外",
      msg: `この講座は現在公開期間外のため視聴できません(公開期間:${fmtDate(publishStart)} 〜 ${fmtDate(publishEnd)})`,
    };
  }
  if (enrollment) {
    if (now > enrollment.enrollEnd) {
      return {
        viewable: false,
        label: "受講期間外",
        msg: `受講期間が終了しています(受講期間:${fmtDate(enrollment.enrollStart)} 〜 ${fmtDate(enrollment.enrollEnd)})`,
      };
    }
    if (now < enrollment.enrollStart) {
      return {
        viewable: false,
        label: "受講開始前",
        msg: `受講開始前です(受講期間:${fmtDate(enrollment.enrollStart)} 〜 ${fmtDate(enrollment.enrollEnd)})`,
      };
    }
  }
  return { viewable: true, label: null, msg: null };
}

export type Status = "done" | "active" | "none";

/** 進捗率 → 状態(未着手 0% / 受講中 1〜99% / 修了 100%) */
export function statusOf(pct: number): Status {
  if (pct >= 100) return "done";
  if (pct > 0) return "active";
  return "none";
}

/** 講座修了率 = 完了ユニット数 ÷ 講座内の全ユニット数(全ユニット均等扱い) */
export function computePct(doneCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((doneCount / totalCount) * 100);
}
