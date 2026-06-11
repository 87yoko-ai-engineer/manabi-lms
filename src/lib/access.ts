// ============================================================
// Manabi LMS — 期間判定・進捗計算ロジック (STU-08 / ERR-07,08)
// ============================================================
import { Course, ENROLLMENTS, courseUnitIds } from "./data";

/** デモ基準日(シードデータの進捗バリエーションと整合する固定日) */
export const NOW = new Date(2026, 5, 10);

function parseD(s: string): Date {
  const [y, m, d] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

export interface Access {
  viewable: boolean;
  label: string | null;
  msg: string | null;
}

/** 講座の閲覧可否(公開期間・受講期間)を判定 */
export function accessOf(course: Course, userId: string): Access {
  const ps = parseD(course.publishStart);
  const pe = parseD(course.publishEnd);
  if (NOW < ps || NOW > pe) {
    return {
      viewable: false,
      label: "公開期間外",
      msg: `この講座は現在公開期間外のため視聴できません(公開期間:${course.publishStart} 〜 ${course.publishEnd})`,
    };
  }
  const en = ENROLLMENTS.find((e) => e.userId === userId && e.courseId === course.id);
  if (en) {
    const es = parseD(en.enrollStart);
    const ee = parseD(en.enrollEnd);
    if (NOW > ee) {
      return { viewable: false, label: "受講期間外", msg: `受講期間が終了しています(受講期間:${en.enrollStart} 〜 ${en.enrollEnd})` };
    }
    if (NOW < es) {
      return { viewable: false, label: "受講開始前", msg: `受講開始前です(受講期間:${en.enrollStart} 〜 ${en.enrollEnd})` };
    }
  }
  return { viewable: true, label: null, msg: null };
}

export type Status = "done" | "active" | "none";

export function statusOf(pct: number): Status {
  if (pct >= 100) return "done";
  if (pct > 0) return "active";
  return "none";
}

/** 講座修了率 = 完了ユニット数 ÷ 講座内の全ユニット数 */
export function pctOf(course: Course, done: Set<string>): number {
  const ids = courseUnitIds(course);
  if (!ids.length) return 0;
  return Math.round((ids.filter((id) => done.has(id)).length / ids.length) * 100);
}
