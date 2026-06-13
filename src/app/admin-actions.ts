"use server";
// ============================================================
// Manabi LMS — 管理者用 Server Actions (ADM-01〜04)
// すべてのアクションでサーバー側の管理者ロール検証を行う(AUTH-03/非機能要件)
//
// revalidatePath("/", "layout")(全体再検証)のままにしている理由(L-4):
// 管理CRUDは低頻度な上、講座名などは受講者ホーム・講座詳細・管理画面の
// すべてに表示されるため、絞り込む利益が薄い。高頻度な進捗トグル
// (actions.ts)のみページ単位に絞っている。
// ============================================================
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/dal";
import type { ActionResult } from "@/lib/types";

/** 管理者でなければエラーを返す共通ガード */
async function requireAdmin(): Promise<ActionResult | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { ok: false, error: "アクセス権限がありません" };
  return null;
}

/**
 * 削除系アクションの共通実行ヘルパー(M-3)
 * - P2025(対象が存在しない): 二重クリックや別画面での削除と競合したケース。
 *   「消す」という目的は既に達成されているため、エラーにせず成功扱いにする(冪等)
 * - P2003(外部キー制約): 現スキーマはカスケード削除のため通常発生しないが、
 *   スキーマ変更時の保険として 500 ではなくメッセージで返す
 * - それ以外は想定外として throw し、error.tsx(ERR-06)に表示を任せる
 */
async function runDelete(label: string, del: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await del();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, error: `関連するデータが残っているため${label}を削除できません` };
    }
    if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2025") throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

function parseDateInput(s: string): Date | null {
  // <input type="date"> の "YYYY-MM-DD" をUTC midnightとして解釈
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

// ============================================================
// 入力検証の共通ルール(改善提案 M-4)
// UIのmaxLength等に頼らず、サーバー側で形式と長さを最終検証する
// ============================================================

/** DBやUIレイアウトを壊す異常長入力を弾く上限(通常運用では届かない値) */
const MAX = {
  title: 100,
  subtitle: 200,
  category: 50,
  description: 2000,
  goal: 200,
  goalsCount: 20,
  coverLabel: 10,
  name: 100,
  email: 254, // RFC 5321 のアドレス長上限
  password: 100,
  minutes: 6000, // 学習時間目安の上限(100時間)
} as const;

function tooLong(label: string, value: string, max: number): string | null {
  return value.length > max ? `${label}は${max}文字以内にしてください` : null;
}

/** accent は coverOf() でCSS文字列に埋め込むため、#RRGGBB 形式のみ許可(CSS注入対策) */
function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

/** 厳密なRFC準拠ではなく「@とドメインを持つ」程度の妥当性チェック(送達確認は行わない) */
function isEmailLike(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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

/**
 * 検証に通ったらパース済みの公開期間も一緒に返す。
 * 呼び出し側で parseDateInput(...)! と再パースする必要がなくなり、
 * 非nullアサーション(!)を排除できる(L-1)
 */
type CourseValidation =
  | { ok: false; error: string }
  | { ok: true; publishStart: Date; publishEnd: Date };

function validateCourse(input: CourseInput): CourseValidation {
  const fail = (error: string): CourseValidation => ({ ok: false, error });
  if (!input.title.trim()) return fail("タイトルを入力してください");
  if (!input.category.trim()) return fail("カテゴリを入力してください");
  if (!input.publishStart) return fail("公開開始日を入力してください");
  if (!input.publishEnd) return fail("公開終了日を入力してください");
  const ps = parseDateInput(input.publishStart);
  const pe = parseDateInput(input.publishEnd);
  if (!ps || !pe) return fail("公開期間の日付形式が不正です");
  if (ps > pe) return fail("公開終了日は公開開始日以降にしてください");
  const lenErr =
    tooLong("タイトル", input.title.trim(), MAX.title) ??
    tooLong("サブタイトル", input.subtitle.trim(), MAX.subtitle) ??
    tooLong("カテゴリ", input.category.trim(), MAX.category) ??
    tooLong("説明", input.description.trim(), MAX.description) ??
    tooLong("カバーラベル", input.coverLabel.trim(), MAX.coverLabel);
  if (lenErr) return fail(lenErr);
  if (input.goals.length > MAX.goalsCount) return fail(`学習目標は${MAX.goalsCount}件以内にしてください`);
  for (const g of input.goals) {
    const err = tooLong("学習目標", g.trim(), MAX.goal);
    if (err) return fail(err);
  }
  if (!isHexColor(input.accent)) return fail("テーマカラーの形式が不正です");
  return { ok: true, publishStart: ps, publishEnd: pe };
}

export async function createCourse(input: CourseInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const v = validateCourse(input);
  if (!v.ok) return v;

  const course = await prisma.course.create({
    data: {
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      category: input.category.trim(),
      tag: input.tag === "必須" ? "必須" : "任意",
      description: input.description.trim(),
      goals: input.goals.map((g) => g.trim()).filter(Boolean),
      publishStart: v.publishStart,
      publishEnd: v.publishEnd,
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
  const v = validateCourse(input);
  if (!v.ok) return v;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      category: input.category.trim(),
      tag: input.tag === "必須" ? "必須" : "任意",
      description: input.description.trim(),
      goals: input.goals.map((g) => g.trim()).filter(Boolean),
      publishStart: v.publishStart,
      publishEnd: v.publishEnd,
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
  return runDelete("講座", () => prisma.course.delete({ where: { id: courseId } }));
}

// ============================================================
// ADM-02: チャプター・ユニットCRUD + 並び替え
// ============================================================

export async function createChapter(courseId: string, title: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!title.trim()) return { ok: false, error: "チャプター名を入力してください" };
  const lenErr = tooLong("チャプター名", title.trim(), MAX.title);
  if (lenErr) return { ok: false, error: lenErr };
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
  const lenErr = tooLong("チャプター名", title.trim(), MAX.title);
  if (lenErr) return { ok: false, error: lenErr };
  await prisma.chapter.update({ where: { id: chapterId }, data: { title: title.trim() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** チャプター削除: 配下ユニット+UnitProgressはカスケード削除 */
export async function deleteChapter(chapterId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  return runDelete("チャプター", () => prisma.chapter.delete({ where: { id: chapterId } }));
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
  if (input.estimatedMinutes > MAX.minutes) return `学習時間目安は${MAX.minutes}分以内にしてください`;
  const lenErr = tooLong("ユニット名", input.title.trim(), MAX.title);
  if (lenErr) return lenErr;
  // 動画IDはURL→ID抽出後に検証するため createUnit / updateUnit 側でチェック
  return null;
}

/** YouTube動画IDの文字種チェック(iframe srcに埋め込むため英数・-・_ のみ許可) */
function isValidVideoId(s: string): boolean {
  return /^[\w-]{6,20}$/.test(s);
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
  const videoId = normalizeVideoId(input.youtubeVideoId);
  if (!isValidVideoId(videoId)) return { ok: false, error: "YouTube動画IDの形式が不正です" };
  const max = await prisma.unit.aggregate({ where: { chapterId }, _max: { sortOrder: true } });
  await prisma.unit.create({
    data: {
      chapterId,
      title: input.title.trim(),
      youtubeVideoId: videoId,
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
  const videoId = normalizeVideoId(input.youtubeVideoId);
  if (!isValidVideoId(videoId)) return { ok: false, error: "YouTube動画IDの形式が不正です" };
  await prisma.unit.update({
    where: { id: unitId },
    data: {
      title: input.title.trim(),
      youtubeVideoId: videoId,
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
  return runDelete("ユニット", () => prisma.unit.delete({ where: { id: unitId } }));
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

/** NIST SP 800-63B に寄せた最小長(L-2)。デモアカウントはシード投入のため影響しない */
const PASSWORD_MIN = 12;

/** 氏名・メール・パスワードの共通検証(パスワードは指定がある場合のみ) */
function validateStudent(input: StudentInput): string | null {
  if (!input.name.trim()) return "氏名を入力してください";
  if (!input.email.trim()) return "メールアドレスを入力してください";
  return (
    tooLong("氏名", input.name.trim(), MAX.name) ??
    tooLong("メールアドレス", input.email.trim(), MAX.email) ??
    (!isEmailLike(input.email.trim()) ? "メールアドレスの形式が不正です" : null) ??
    (input.password && input.password.length < PASSWORD_MIN
      ? `パスワードは${PASSWORD_MIN}文字以上にしてください`
      : null) ??
    (input.password ? tooLong("パスワード", input.password, MAX.password) : null)
  );
}

export async function createStudent(input: StudentInput): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!input.password) return { ok: false, error: "初期パスワードを入力してください" };
  const err = validateStudent(input);
  if (err) return { ok: false, error: err };

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
  const err = validateStudent(input);
  if (err) return { ok: false, error: err };

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

/**
 * 受講者の物理削除(誤登録・テストユーザー・本人からの消去請求向け)
 * 通常の退会・利用停止は無効化(isActive=false)を使い、進捗履歴を保持すること。
 * 割当・完了記録はスキーマのカスケードで同時に削除される。
 */
export async function deleteStudent(userId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "受講者が見つかりません" };
  if (target.role !== "student") return { ok: false, error: "管理者アカウントは削除できません" };
  return runDelete("受講者", () => prisma.user.delete({ where: { id: userId } }));
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
