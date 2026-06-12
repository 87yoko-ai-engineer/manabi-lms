// ============================================================
// Manabi LMS — DAL 認可のユニットテスト
// 対象: getCourseDetail の割当チェック(未割当講座の直URL閲覧の遮断)
// prisma / auth / next はモックし、認可ロジックだけを検証する。
// 実行: npm test
// ============================================================
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    course: { findUnique: vi.fn() },
    unit: { findUnique: vi.fn() },
    unitProgress: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getCourseDetail } from "@/lib/dal";

const mocked = vi.mocked(prisma, true);

/** 公開期間内の講座(チャプター1・ユニット2)。enrollments だけ差し替えて使う */
function courseFixture(enrollments: { enrollStart: Date; enrollEnd: Date }[]) {
  return {
    id: "c-1",
    title: "テスト講座",
    category: "テスト",
    tag: "必須",
    description: "",
    goals: [],
    publishStart: new Date(Date.UTC(2020, 0, 1)),
    publishEnd: new Date(Date.UTC(2099, 11, 31)),
    accent: "#3B5BDB",
    cover: "",
    coverLabel: "TST",
    chapters: [
      {
        id: "ch-1",
        title: "Chapter 01",
        units: [
          { id: "un-1", title: "ユニット1", estimatedMinutes: 10 },
          { id: "un-2", title: "ユニット2", estimatedMinutes: 20 },
        ],
      },
    ],
    enrollments,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCourseDetail の認可(割当チェック)", () => {
  it("講座が存在しても、割り当てられていないユーザーには null を返す(直URL対策)", async () => {
    mocked.course.findUnique.mockResolvedValue(courseFixture([]) as never);

    const result = await getCourseDetail("c-1", "u-unassigned");

    expect(result).toBeNull();
    // 拒否した場合は進捗の取得すら行わない
    expect(mocked.unitProgress.findMany).not.toHaveBeenCalled();
  });

  it("割り当てられているユーザーには講座詳細を返す", async () => {
    const en = {
      enrollStart: new Date(Date.UTC(2020, 0, 1)),
      enrollEnd: new Date(Date.UTC(2099, 11, 31)),
    };
    mocked.course.findUnique.mockResolvedValue(courseFixture([en]) as never);
    mocked.unitProgress.findMany.mockResolvedValue([{ unitId: "un-1" }] as never);

    const result = await getCourseDetail("c-1", "u-enrolled");

    expect(result).not.toBeNull();
    expect(result!.id).toBe("c-1");
    expect(result!.pct).toBe(50); // 2ユニット中1完了
    expect(result!.access.viewable).toBe(true);
  });

  it("存在しない講座IDには null を返す", async () => {
    mocked.course.findUnique.mockResolvedValue(null as never);

    const result = await getCourseDetail("no-such-id", "u-1");

    expect(result).toBeNull();
  });
});
