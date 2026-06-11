"use server";
// ============================================================
// Manabi LMS — 管理者用 Server Actions (ADM-01〜04)
// すべてのアクションでサーバー側の管理者ロール検証を行う(AUTH-03/非機能要件)
// ============================================================
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/dal";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** 管理者でなければエラーを返す共通ガード */
async function requireAdmin(): Promise<ActionResult | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { ok: false, error: "アクセス権限がありません" };
  return null;
}

function parseDateInput(s: string): Date | null {
  // <input type="date"> の "YYYY-MM-DD" をUTC midnightとして解釈
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/** アクセントカラーからカバーグラデーションを導出 */
function coverOf(accent: string): string {
  return `linear-gradient(135deg, color-mix(in srgb, ${accent} 80%, #000) 0%, ${accent} 55%, color-mix(in srgb, ${accent} 65%, #fff) 100%)`;
}

// ============================================================
// ADM-01: 講座CRUD
// ============================================================

export interface CourseInput {
  title: string;
  subtitle: string;
  category: string;
  tag: string;
  description: string;
  goals: string[];
  publishStart: string; // "YYYY-MM-DD"
  publishEnd: string;
  accent: string;
  coverLabel: string;
}

function validateCourse(input: CourseInput): string | null {
  if (!input.title.trim()) return "タイトルを入力してください";
  if (!input.category.trim()) return "カテゴリを入力してください";
  if (!input.publishStart) return "公開開始日を入力してください";
  if (!input.publishEnd) return "公開終了日を入力してください";
  const ps = parseDateInput(input.publishStart);
  const pe = parseDateInput(input.publishEnd);
  if (!ps || !pe) return "公開期間の日付形式が不正です";
  if (ps > pe) return "公開終了日は公開開始日以降にしてください";
  return null;
}

export async function createCourse(input: CourseInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const err = validateCourse(input);
  if (err) return { ok: false, error: err };

  const course = await prisma.course.create({
    data: {
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      category: input.category.trim(),
      tag: input.tag === "必須" ? "必須" : "任意",
      description: input.description.trim(),
      goals: input.goals.map((g) => g.trim()).filter(Boolean),
      publishStart: parseDateInput(input.publishStart)!,
      publishEnd: parseDateInput(input.publishEnd)!,
      accent: input.accent,
      cover: coverOf(input.accent),
      coverLabel: input.coverLabel.trim().toUpperCase() || input.title.trim().slice(0, 3).toUpperCase(),
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, id: course.id };
}

export async function updateCourse(courseId: string, input: CourseInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const err = validateCourse(input);
  if (err) return { ok: false, error: err };

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      category: input.category.trim(),
      tag: input.tag === "必須" ? "必須" : "任意",
      description: input.description.trim(),
      goals: input.goals.map((g) => g.trim()).filter(Boolean),
      publishStart: parseDateInput(input.publishStart)!,
      publishEnd: parseDateInput(input.publishEnd)!,
      accent: input.accent,
      cover: coverOf(input.accent),
      coverLabel: input.coverLabel.trim().toUpperCase(),
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, id: courseId };
}

/** 講座削除: 配下のチャプター・ユニット・Enrollment・UnitProgressはスキーマのカスケードで削除 */
export async function deleteCourse(courseId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// ADM-02: チャプター・ユニットCRUD + 並び替え
// ============================================================

export async function createChapter(courseId: string, title: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!title.trim()) return { ok: false, error: "チャプター名を入力してください" };
  const max = await prisma.chapter.aggregate({ where: { courseId }, _max: { sortOrder: true } });
  await prisma.chapter.create({
    data: { courseId, title: title.trim(), sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateChapter(chapterId: string, title: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!title.trim()) return { ok: false, error: "チャプター名を入力してください" };
  await prisma.chapter.update({ where: { id: chapterId }, data: { title: title.trim() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** チャプター削除: 配下ユニット+UnitProgressはカスケード削除 */
export async function deleteChapter(chapterId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  await prisma.chapter.delete({ where: { id: chapterId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function moveChapter(chapterId: string, dir: "up" | "down"): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const ch = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!ch) return { ok: false, error: "チャプターが見つかりません" };
  const neighbor = await prisma.chapter.findFirst({
    where: { courseId: ch.courseId, sortOrder: dir === "up" ? { lt: ch.sortOrder } : { gt: ch.sortOrder } },
    orderBy: { sortOrder: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return { ok: true }; // 端なら何もしない
  await prisma.$transaction([
    prisma.chapter.update({ where: { id: ch.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.chapter.update({ where: { id: neighbor.id }, data: { sortOrder: ch.sortOrder } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface UnitInput {
  title: string;
  youtubeVideoId: string;
  estimatedMinutes: number;
}

function validateUnit(input: UnitInput): string | null {
  if (!input.title.trim()) return "ユニット名を入力してください";
  if (!input.youtubeVideoId.trim()) return "YouTube動画IDを入力してください";
  if (!Number.isFinite(input.estimatedMinutes) || input.estimatedMinutes < 0) return "学習時間目安を入力してください";
  return null;
}

/** URLが貼られても動画IDを取り出せるようにする */
function normalizeVideoId(raw: string): string {
  const s = raw.trim();
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(s);
  return m ? m[1] : s;
}

export async function createUnit(chapterId: string, input: UnitInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const err = validateUnit(input);
  if (err) return { ok: false, error: err };
  const max = await prisma.unit.aggregate({ where: { chapterId }, _max: { sortOrder: true } });
  await prisma.unit.create({
    data: {
      chapterId,
      title: input.title.trim(),
      youtubeVideoId: normalizeVideoId(input.youtubeVideoId),
      estimatedMinutes: Math.round(input.estimatedMinutes),
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateUnit(unitId: string, input: UnitInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const err = validateUnit(input);
  if (err) return { ok: false, error: err };
  await prisma.unit.update({
    where: { id: unitId },
    data: {
      title: input.title.trim(),
      youtubeVideoId: normalizeVideoId(input.youtubeVideoId),
      estimatedMinutes: Math.round(input.estimatedMinutes),
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** ユニット削除: 関連UnitProgressはカスケード削除 */
export async function deleteUnit(unitId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  await prisma.unit.delete({ where: { id: unitId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function moveUnit(unitId: string, dir: "up" | "down"): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const u = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!u) return { ok: false, error: "ユニットが見つかりません" };
  const neighbor = await prisma.unit.findFirst({
    where: { chapterId: u.chapterId, sortOrder: dir === "up" ? { lt: u.sortOrder } : { gt: u.sortOrder } },
    orderBy: { sortOrder: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return { ok: true };
  await prisma.$transaction([
    prisma.unit.update({ where: { id: u.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.unit.update({ where: { id: neighbor.id }, data: { sortOrder: u.sortOrder } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ============================================================
// ADM-03: 受講者アカウントの発行・編集・無効化 (AUTH-05)
// ============================================================

export interface StudentInput {
  name: string;
  email: string;
  /** 新規発行時は必須。編集時は空なら変更しない(上書き更新) */
  password: string;
  isActive: boolean;
}

export async function createStudent(input: StudentInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!input.name.trim()) return { ok: false, error: "氏名を入力してください" };
  if (!input.email.trim()) return { ok: false, error: "メールアドレスを入力してください" };
  if (!input.password) return { ok: false, error: "初期パスワードを入力してください" };
  if (input.password.length < 8) return { ok: false, error: "パスワードは8文字以上にしてください" };

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, 10),
        role: "student",
        isActive: true,
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, id: user.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "このメールアドレスは既に登録されています" };
    }
    throw e;
  }
}

export async function updateStudent(userId: string, input: StudentInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!input.name.trim()) return { ok: false, error: "氏名を入力してください" };
  if (!input.email.trim()) return { ok: false, error: "メールアドレスを入力してください" };
  if (input.password && input.password.length < 8) return { ok: false, error: "パスワードは8文字以上にしてください" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "student") return { ok: false, error: "受講者が見つかりません" };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        isActive: input.isActive,
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 10) } : {}),
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, id: userId };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "このメールアドレスは既に登録されています" };
    }
    throw e;
  }
}

// ============================================================
// ADM-04: 講座割り当てと受講期間設定
// ============================================================

export async function assignCourse(userId: string, courseId: string, start: string, end: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const es = parseDateInput(start);
  const ee = parseDateInput(end);
  if (!es) return { ok: false, error: "受講開始日を入力してください" };
  if (!ee) return { ok: false, error: "受講終了日を入力してください" };
  if (es > ee) return { ok: false, error: "受講終了日は受講開始日以降にしてください" };

  // upsert: 複合ユニーク制約(userId, courseId)により二重割り当てを防止しつつ期間更新を可能にする
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, enrollStart: es, enrollEnd: ee },
    update: { enrollStart: es, enrollEnd: ee },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function unassignCourse(userId: string, courseId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  revalidatePath("/", "layout");
  return { ok: true };
}
