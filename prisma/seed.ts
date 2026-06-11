// ============================================================
// Manabi LMS — シードスクリプト(npm run seed で再実行可能)
// src/lib/data.ts のモックデータを単一の真実としてDBへ投入する。
// 再実行時は全テーブルを削除してから入れ直す(冪等)。
// ============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { USERS, COURSES, ENROLLMENTS, INITIAL_PROGRESS } from "../src/lib/data";

const prisma = new PrismaClient();

/** 全デモアカウント共通の初期パスワード */
const DEMO_PASSWORD = "demo-pass";

function parseD(s: string): Date {
  const [y, m, d] = s.split("/").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function main() {
  console.log("🌱 シード開始");

  // 依存順に全削除(再実行可能にする)
  await prisma.unitProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users ----
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.createMany({
    data: USERS.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      passwordHash,
      role: u.role,
      isActive: u.isActive,
    })),
  });
  console.log(`  ✓ ユーザー ${USERS.length} 名`);

  // ---- Courses → Chapters → Units ----
  for (const c of COURSES) {
    await prisma.course.create({
      data: {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        category: c.category,
        tag: c.tag,
        goals: c.goals,
        publishStart: parseD(c.publishStart),
        publishEnd: parseD(c.publishEnd),
        accent: c.accent,
        cover: c.cover,
        coverLabel: c.coverLabel,
        chapters: {
          create: c.chapters.map((ch, ci) => ({
            id: ch.id,
            title: ch.title,
            sortOrder: ci,
            units: {
              create: ch.units.map((u, ui) => ({
                id: u.id,
                title: u.title,
                youtubeVideoId: u.youtubeVideoId,
                estimatedMinutes: u.estimatedMinutes,
                sortOrder: ui,
              })),
            },
          })),
        },
      },
    });
  }
  console.log(`  ✓ 講座 ${COURSES.length} 件`);

  // ---- Enrollments ----
  await prisma.enrollment.createMany({
    data: ENROLLMENTS.map((e) => ({
      userId: e.userId,
      courseId: e.courseId,
      enrollStart: parseD(e.enrollStart),
      enrollEnd: parseD(e.enrollEnd),
    })),
  });
  console.log(`  ✓ 受講割当 ${ENROLLMENTS.length} 件`);

  // ---- UnitProgress(進捗バリエーション) ----
  const progressRows = Object.entries(INITIAL_PROGRESS).flatMap(([userId, unitIds]) =>
    unitIds.map((unitId) => ({ userId, unitId })),
  );
  await prisma.unitProgress.createMany({ data: progressRows });
  console.log(`  ✓ 完了記録 ${progressRows.length} 件`);

  console.log(`🌱 シード完了(全アカウントのパスワード: ${DEMO_PASSWORD})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
