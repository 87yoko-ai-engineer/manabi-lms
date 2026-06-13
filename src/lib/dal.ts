// ============================================================
// Manabi LMS — データアクセス層(Server Components / Server Actions 専用)
// 認可: セッション検証はここで必ず行い、クライアント側の制御に依存しない。
// なりすまし(管理者の受講者ビュー)は httpOnly Cookie "viewAs" で表現。
// ============================================================
import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accessOf, computePct, fmtDate } from "@/lib/access";
import { USERS } from "@/lib/data";
import type {
  UiUser, CourseListItem, CourseDetailDTO, UnitViewDTO,
  AdminDashboardDTO, AdminCourseRow, AdminStudentRow,
  AdminCourseEdit, EnrollmentEditorData,
} from "@/lib/types";

export const VIEW_AS_COOKIE = "viewAs";

const AVATAR_COLORS = ["#3B5BDB", "#1098AD", "#E8590C", "#6741D9", "#0CA678", "#C92A2A"];

/** DBユーザー → UI用ユーザー(アバターの頭文字・色はシードのモック定義を優先) */
function toUiUser(u: { id: string; name: string; email: string; role: "admin" | "student"; isActive: boolean }): UiUser {
  const known = USERS.find((m) => m.id === u.id);
  const hash = [...u.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    initials: known?.initials ?? u.name.charAt(0),
    color: known?.color ?? AVATAR_COLORS[hash % AVATAR_COLORS.length],
  };
}

/** ログイン中のユーザー(セッション必須。middlewareが保証するが二重に検証) */
export const getSessionUser = cache(async (): Promise<UiUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!u || !u.isActive) return null;
  return toUiUser(u);
});

/**
 * 受講者視点の操作対象ユーザー。
 * 管理者が viewAs Cookie を持つ場合のみ、その受講者として振る舞う(なりすまし)。
 */
export const getActingUser = cache(async (): Promise<{ sessionUser: UiUser; actingUser: UiUser; impersonating: boolean } | null> => {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  if (sessionUser.role === "admin") {
    const viewAsId = (await cookies()).get(VIEW_AS_COOKIE)?.value;
    if (viewAsId) {
      const target = await prisma.user.findUnique({ where: { id: viewAsId } });
      if (target && target.role === "student" && target.isActive) {
        return { sessionUser, actingUser: toUiUser(target), impersonating: true };
      }
    }
  }
  return { sessionUser, actingUser: sessionUser, impersonating: false };
});

// ============================================================
// 受講者向けクエリ
// ============================================================

/** STU-01,02: 割当講座一覧(修了率・受講期間・期間判定つき) */
export async function getStudentCourses(userId: string): Promise<CourseListItem[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { course: { createdAt: "asc" } },
    include: {
      course: {
        include: { chapters: { include: { units: { select: { id: true, estimatedMinutes: true } } } } },
      },
    },
  });
  const doneSet = await getDoneSet(userId);

  return enrollments.map(({ course, enrollStart, enrollEnd }) => {
    const units = course.chapters.flatMap((ch) => ch.units);
    const doneCount = units.filter((u) => doneSet.has(u.id)).length;
    return {
      id: course.id,
      title: course.title,
      category: course.category,
      tag: course.tag,
      description: course.description,
      publishStart: fmtDate(course.publishStart),
      publishEnd: fmtDate(course.publishEnd),
      accent: course.accent,
      cover: course.cover,
      coverLabel: course.coverLabel,
      chaptersCount: course.chapters.length,
      minutes: units.reduce((s, u) => s + u.estimatedMinutes, 0),
      pct: computePct(doneCount, units.length),
      access: accessOf({ publishStart: course.publishStart, publishEnd: course.publishEnd, enrollment: { enrollStart, enrollEnd } }),
    };
  });
}

/** ユーザーの完了ユニットIDセット */
async function getDoneSet(userId: string): Promise<Set<string>> {
  const rows = await prisma.unitProgress.findMany({ where: { userId }, select: { unitId: true } });
  return new Set(rows.map((r) => r.unitId));
}

/** STU-03: 講座詳細(チャプター → ユニット階層 + 完了チェック) */
export async function getCourseDetail(courseId: string, userId: string): Promise<CourseDetailDTO | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: { sortOrder: "asc" },
        include: { units: { orderBy: { sortOrder: "asc" } } },
      },
      enrollments: { where: { userId } },
    },
  });
  if (!course) return null;
  // 認可: 割り当てられていない講座は存在しない扱いで拒否する(直URL対策)。
  // 一覧(STU-01)に出ないだけではなく、サーバー側でも閲覧を遮断する。
  if (course.enrollments.length === 0) return null;

  const doneSet = await getDoneSet(userId);
  const allUnits = course.chapters.flatMap((ch) => ch.units);
  const doneCount = allUnits.filter((u) => doneSet.has(u.id)).length;
  const nextUnit = allUnits.find((u) => !doneSet.has(u.id)) ?? allUnits[0];
  const en = course.enrollments[0];

  return {
    id: course.id,
    title: course.title,
    category: course.category,
    tag: course.tag,
    description: course.description,
    goals: course.goals,
    publishStart: fmtDate(course.publishStart),
    publishEnd: fmtDate(course.publishEnd),
    accent: course.accent,
    cover: course.cover,
    coverLabel: course.coverLabel,
    minutes: allUnits.reduce((s, u) => s + u.estimatedMinutes, 0),
    pct: computePct(doneCount, allUnits.length),
    access: accessOf({
      publishStart: course.publishStart,
      publishEnd: course.publishEnd,
      enrollment: en ? { enrollStart: en.enrollStart, enrollEnd: en.enrollEnd } : null,
    }),
    doneCount,
    unitCount: allUnits.length,
    nextUnitId: nextUnit?.id ?? null,
    chapters: course.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      units: ch.units.map((u) => ({
        id: u.id,
        title: u.title,
        estimatedMinutes: u.estimatedMinutes,
        done: doneSet.has(u.id),
      })),
    })),
  };
}

/** STU-04: ユニット視聴ページ(プレイヤー・前後ナビ・サイドバー) */
export async function getUnitView(courseId: string, unitId: string, userId: string): Promise<UnitViewDTO | null> {
  const detail = await getCourseDetail(courseId, userId);
  if (!detail) return null;

  const flat = detail.chapters.flatMap((ch) => ch.units.map((u) => ({ ...u, chapterId: ch.id, chapterTitle: ch.title })));
  const index = flat.findIndex((u) => u.id === unitId);
  if (index === -1) return null;
  const cur = flat[index];

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) return null;

  return {
    course: { id: detail.id, title: detail.title },
    chapter: { id: cur.chapterId, title: cur.chapterTitle },
    unit: { id: unit.id, title: unit.title, estimatedMinutes: unit.estimatedMinutes, youtubeVideoId: unit.youtubeVideoId },
    done: cur.done,
    access: detail.access,
    index,
    total: flat.length,
    prevId: flat[index - 1]?.id ?? null,
    nextId: flat[index + 1]?.id ?? null,
    sidebar: detail.chapters,
  };
}

// ============================================================
// 管理者向けクエリ (ADM-05)
// 集計はアプリ側で実施: デモ規模(受講者5名×講座5件)では可読性を優先し、
// 生SQL/マテビューへの移行余地は設計上認識している(§12)
// ============================================================

/** 受講者×講座の修了率マトリクスと講座別集計 */
export async function getAdminDashboard(): Promise<AdminDashboardDTO> {
  const [students, courses, enrollments, progress] = await Promise.all([
    prisma.user.findMany({ where: { role: "student" }, orderBy: { createdAt: "asc" } }),
    prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      include: { chapters: { include: { units: { select: { id: true } } } } },
    }),
    prisma.enrollment.findMany(),
    prisma.unitProgress.findMany({ select: { userId: true, unitId: true } }),
  ]);

  const doneByUser = new Map<string, Set<string>>();
  for (const p of progress) {
    // 「なければ作って入れる」を ?? で表現(L-1: 非nullアサーションを使わない)
    const set = doneByUser.get(p.userId) ?? new Set<string>();
    set.add(p.unitId);
    doneByUser.set(p.userId, set);
  }
  const courseUnits = new Map(courses.map((c) => [c.id, c.chapters.flatMap((ch) => ch.units.map((u) => u.id))]));
  const isEnrolled = (userId: string, courseId: string) =>
    enrollments.some((e) => e.userId === userId && e.courseId === courseId);
  const pct = (userId: string, courseId: string) => {
    const ids = courseUnits.get(courseId) ?? [];
    const done = doneByUser.get(userId) ?? new Set();
    return computePct(ids.filter((id) => done.has(id)).length, ids.length);
  };

  const courseStats = courses.map((c) => {
    const enrolled = students.filter((s) => isEnrolled(s.id, c.id));
    const avg = enrolled.length
      ? Math.round(enrolled.reduce((sum, s) => sum + pct(s.id, c.id), 0) / enrolled.length)
      : 0;
    return {
      id: c.id,
      title: c.title,
      accent: c.accent,
      coverLabel: c.coverLabel,
      enrolled: enrolled.length,
      avg,
      doneN: enrolled.filter((s) => pct(s.id, c.id) >= 100).length,
    };
  });

  const studentRows = students.map((s) => {
    const enrolledCourses = courses.filter((c) => isEnrolled(s.id, c.id));
    const avg = enrolledCourses.length
      ? Math.round(enrolledCourses.reduce((sum, c) => sum + pct(s.id, c.id), 0) / enrolledCourses.length)
      : 0;
    return {
      user: toUiUser(s),
      cells: courses.map((c) => (isEnrolled(s.id, c.id) ? { pct: pct(s.id, c.id) } : null)),
      avg,
    };
  });

  const activeStudents = students.filter((s) => s.isActive);
  const overallAvg = Math.round(
    studentRows.filter((r) => r.user.isActive).reduce((a, r) => a + r.avg, 0) / (activeStudents.length || 1),
  );

  return {
    kpis: {
      activeStudents: activeStudents.length,
      inactiveStudents: students.length - activeStudents.length,
      courseCount: courses.length,
      unitCount: [...courseUnits.values()].reduce((a, ids) => a + ids.length, 0),
      overallAvg,
      completedEnroll: enrollments.filter((e) => pct(e.userId, e.courseId) >= 100).length,
      totalEnroll: enrollments.length,
    },
    courseStats,
    students: studentRows,
  };
}

/** ADM-01: 講座管理一覧 */
export async function getAdminCourses(): Promise<AdminCourseRow[]> {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { chapters: { include: { units: { select: { estimatedMinutes: true } } } } },
  });
  return courses.map((c) => {
    const units = c.chapters.flatMap((ch) => ch.units);
    return {
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      category: c.category,
      tag: c.tag,
      cover: c.cover,
      coverLabel: c.coverLabel,
      chaptersCount: c.chapters.length,
      unitCount: units.length,
      minutes: units.reduce((s, u) => s + u.estimatedMinutes, 0),
      publishStart: fmtDate(c.publishStart),
      publishEnd: fmtDate(c.publishEnd),
    };
  });
}

/** Date → <input type="date"> 用 "YYYY-MM-DD" */
function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ADM-01,02: 講座編集フォーム用の完全な講座データ */
export async function getAdminCourseEdit(courseId: string): Promise<AdminCourseEdit | null> {
  const c = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: { sortOrder: "asc" },
        include: { units: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    category: c.category,
    tag: c.tag,
    description: c.description,
    goals: c.goals,
    publishStart: toDateInput(c.publishStart),
    publishEnd: toDateInput(c.publishEnd),
    accent: c.accent,
    coverLabel: c.coverLabel,
    chapters: c.chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      units: ch.units.map((u) => ({
        id: u.id,
        title: u.title,
        youtubeVideoId: u.youtubeVideoId,
        estimatedMinutes: u.estimatedMinutes,
      })),
    })),
  };
}

/** ADM-03: 受講者編集フォーム用 */
export async function getStudentForEdit(userId: string): Promise<UiUser | null> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u || u.role !== "student") return null;
  return toUiUser(u);
}

/** ADM-04: 講座割り当て画面用(全講座 × 割当状態) */
export async function getEnrollmentEditor(userId: string): Promise<EnrollmentEditorData | null> {
  const student = await getStudentForEdit(userId);
  if (!student) return null;
  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.enrollment.findMany({ where: { userId } }),
  ]);
  return {
    student,
    rows: courses.map((c) => {
      const en = enrollments.find((e) => e.courseId === c.id);
      return {
        courseId: c.id,
        title: c.title,
        coverLabel: c.coverLabel,
        cover: c.cover,
        category: c.category,
        publishRange: `${fmtDate(c.publishStart)} 〜 ${fmtDate(c.publishEnd)}`,
        publishStart: toDateInput(c.publishStart),
        publishEnd: toDateInput(c.publishEnd),
        enrollStart: en ? toDateInput(en.enrollStart) : null,
        enrollEnd: en ? toDateInput(en.enrollEnd) : null,
      };
    }),
  };
}

/** ADM-03: 受講者管理一覧 */
export async function getAdminStudents(): Promise<AdminStudentRow[]> {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: { createdAt: "asc" },
    include: {
      enrollments: { orderBy: { enrollStart: "asc" } },
      _count: { select: { progress: true } },
    },
  });
  return students.map((s) => ({
    user: toUiUser(s),
    enrollCount: s.enrollments.length,
    progressCount: s._count.progress,
    range: s.enrollments.length
      ? `${fmtDate(s.enrollments[0].enrollStart)} 〜 ${fmtDate(s.enrollments[0].enrollEnd)}`
      : "—",
  }));
}
