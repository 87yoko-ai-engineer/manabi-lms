"use server";
// ============================================================
// Manabi LMS — Server Actions
// 認可はすべてサーバー側で検証する(非機能要件: クライアント制御に依存しない)
// ============================================================
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getActingUser, VIEW_AS_COOKIE } from "@/lib/dal";
import { accessOf } from "@/lib/access";
import type { ActionResult } from "@/lib/types";

/**
 * STU-05: ユニットの手動完了/取り消し(UnitProgress の作成・削除)
 * - 操作できるのは「受講者本人」または「なりすまし中の管理者」のみ
 * - 公開期間外・受講期間外はサーバー側でも拒否(ERR-07/08)
 */
export async function toggleUnitProgress(unitId: string): Promise<ActionResult> {
  const acting = await getActingUser();
  if (!acting) return { ok: false, error: "認証が必要です" };
  const userId = acting.actingUser.id;

  // ユニット → 講座と受講割当を取得して期間を検証
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { chapter: { include: { course: { include: { enrollments: { where: { userId } } } } } } },
  });
  if (!unit) return { ok: false, error: "ユニットが見つかりません" };

  const course = unit.chapter.course;
  const en = course.enrollments[0];
  if (!en) return { ok: false, error: "この講座は割り当てられていません" };

  const access = accessOf({
    publishStart: course.publishStart,
    publishEnd: course.publishEnd,
    enrollment: { enrollStart: en.enrollStart, enrollEnd: en.enrollEnd },
  });
  if (!access.viewable) return { ok: false, error: `${access.label}のため完了できません` };

  // トグル: 既存記録があれば削除、なければ作成(複合ユニーク制約で二重記録を防止)
  const existing = await prisma.unitProgress.findUnique({
    where: { userId_unitId: { userId, unitId } },
  });
  if (existing) {
    await prisma.unitProgress.delete({ where: { id: existing.id } });
  } else {
    await prisma.unitProgress.create({ data: { userId, unitId } });
  }

  // L-4: 進捗トグルは学習中に何度も押される高頻度操作なので、
  // アプリ全体ではなく「進捗が表示されるページ」に絞って再検証する
  revalidatePath("/");                               // 受講者ホーム(講座カード・修了状況サマリー)
  revalidatePath(`/courses/${course.id}`, "layout"); // この講座の詳細と配下のユニット視聴ページ
  revalidatePath("/admin", "layout");                // 管理側の集計(ダッシュボード・受講者詳細)
  return { ok: true };
}

/** 管理者が受講者として受講画面を表示する(なりすまし開始) */
export async function impersonateStudent(studentId: string): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== "admin") redirect("/");

  const target = await prisma.user.findUnique({ where: { id: studentId } });
  if (!target || target.role !== "student" || !target.isActive) redirect("/admin");

  (await cookies()).set(VIEW_AS_COOKIE, studentId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
}

/** なりすましを終了して管理画面へ戻る */
export async function stopImpersonation(): Promise<void> {
  (await cookies()).delete(VIEW_AS_COOKIE);
  redirect("/admin");
}
