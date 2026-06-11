// ============================================================
// Manabi LMS — 期間判定・進捗計算ロジック (STU-08 / ERR-07,08 / §4.4)
// 純粋関数。ユニットテスト対象(access.test.ts)。
//
// 期間判定の方針:
// - 公開期間・受講期間は「カレンダー日付」(DBにはUTC midnightで保存)
// - 「今日」は日本時間(Asia/Tokyo)の日付で判定する
// - 開始日・終了日は両方とも「その日を含む」(開始日の朝から、終了日の夜まで有効)
// ============================================================

/** 現在の日付(日本時間)を "YYYY-MM-DD" で返す */
export function todayJST(): string {
  // sv-SE ロケールは "YYYY-MM-DD" 形式を返す
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** DBのDate(UTC midnight=カレンダー日付) → "YYYY-MM-DD" */
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Date → "YYYY/MM/DD"(表示用) */
export function fmtDate(d: Date): string {
  return dateKey(d).replaceAll("-", "/");
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

/**
 * 講座の閲覧可否(公開期間・受講期間)を判定。
 * "YYYY-MM-DD" 形式は辞書順=日付順なので文字列比較で判定できる。
 * @param today テスト用に注入可能。省略時は日本時間の今日
 */
export function accessOf(input: AccessInput, today: string = todayJST()): Access {
  const ps = dateKey(input.publishStart);
  const pe = dateKey(input.publishEnd);
  if (today < ps || today > pe) {
    return {
      viewable: false,
      label: "公開期間外",
      msg: `この講座は現在公開期間外のため視聴できません(公開期間:${fmtDate(input.publishStart)} 〜 ${fmtDate(input.publishEnd)})`,
    };
  }
  if (input.enrollment) {
    const es = dateKey(input.enrollment.enrollStart);
    const ee = dateKey(input.enrollment.enrollEnd);
    if (today > ee) {
      return {
        viewable: false,
        label: "受講期間外",
        msg: `受講期間が終了しています(受講期間:${fmtDate(input.enrollment.enrollStart)} 〜 ${fmtDate(input.enrollment.enrollEnd)})`,
      };
    }
    if (today < es) {
      return {
        viewable: false,
        label: "受講開始前",
        msg: `受講開始前です(受講期間:${fmtDate(input.enrollment.enrollStart)} 〜 ${fmtDate(input.enrollment.enrollEnd)})`,
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
