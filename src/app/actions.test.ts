// ============================================================
// Manabi LMS — Server Actions 認可のユニットテスト
// 対象:
//   - toggleUnitProgress(STU-05): 未認証・未割当・期間外の拒否
//   - 管理アクション(ADM-01): 受講者/未認証セッションの拒否(requireAdmin)
// prisma / auth / next はモックし、サーバー側の認可だけを検証する。
// 実行: npm test
// ============================================================
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    course: { create: vi.fn() },
    unit: { findUnique: vi.fn() },
    unitProgress: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toggleUnitProgress } from "@/app/actions";
import { createCourse, type CourseInput } from "@/app/admin-actions";

const mockedAuth = vi.mocked(auth);
const mocked = vi.mocked(prisma, true);

/** セッションを「このユーザーでログイン中」に設定する */
function loginAs(user: { id: string; role: "admin" | "student" } | null) {
  if (!user) {
    mockedAuth.mockResolvedValue(null as never);
    return;
  }
  mockedAuth.mockResolvedValue({ user: { id: user.id } } as never);
  mocked.user.findUnique.mockResolvedValue({
    id: user.id,
    name: "テストユーザー",
    email: "test@example.com",
    role: user.role,
    isActive: true,
  } as never);
}

/** toggleUnitProgress が参照する unit → chapter → course → enrollments の形 */
function unitFixture(enrollments: { enrollStart: Date; enrollEnd: Date }[]) {
  return {
    id: "un-1",
    chapter: {
      course: {
        id: "c-1",
        publishStart: new Date(Date.UTC(2020, 0, 1)),
        publishEnd: new Date(Date.UTC(2099, 11, 31)),
        enrollments,
      },
    },
  };
}

const validCourseInput: CourseInput = {
  title: "新講座",
  subtitle: "",
  category: "テスト",
  tag: "任意",
  description: "",
  goals: [],
  publishStart: "2026-01-01",
  publishEnd: "2026-12-31",
  accent: "#3B5BDB",
  coverLabel: "TST",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toggleUnitProgress の認可(STU-05 / ERR-07,08)", () => {
  it("未認証なら拒否する", async () => {
    loginAs(null);

    const res = await toggleUnitProgress("un-1");

    expect(res).toEqual({ ok: false, error: "認証が必要です" });
    expect(mocked.unitProgress.create).not.toHaveBeenCalled();
  });

  it("割り当てられていない講座のユニットは拒否する", async () => {
    loginAs({ id: "u-1", role: "student" });
    mocked.unit.findUnique.mockResolvedValue(unitFixture([]) as never);

    const res = await toggleUnitProgress("un-1");

    expect(res.ok).toBe(false);
    expect(res.error).toContain("割り当てられていません");
    expect(mocked.unitProgress.create).not.toHaveBeenCalled();
  });

  it("受講期間外なら拒否する(ERR-08)", async () => {
    loginAs({ id: "u-1", role: "student" });
    mocked.unit.findUnique.mockResolvedValue(
      unitFixture([
        {
          enrollStart: new Date(Date.UTC(2020, 0, 1)),
          enrollEnd: new Date(Date.UTC(2020, 11, 31)), // 過去に終了
        },
      ]) as never,
    );

    const res = await toggleUnitProgress("un-1");

    expect(res.ok).toBe(false);
    expect(res.error).toContain("受講期間外");
    expect(mocked.unitProgress.create).not.toHaveBeenCalled();
  });

  it("割当済み・期間内なら完了を記録できる", async () => {
    loginAs({ id: "u-1", role: "student" });
    mocked.unit.findUnique.mockResolvedValue(
      unitFixture([
        {
          enrollStart: new Date(Date.UTC(2020, 0, 1)),
          enrollEnd: new Date(Date.UTC(2099, 11, 31)),
        },
      ]) as never,
    );
    mocked.unitProgress.findUnique.mockResolvedValue(null as never); // 未完了 → 作成
    mocked.unitProgress.create.mockResolvedValue({} as never);

    const res = await toggleUnitProgress("un-1");

    expect(res).toEqual({ ok: true });
    expect(mocked.unitProgress.create).toHaveBeenCalledWith({
      data: { userId: "u-1", unitId: "un-1" },
    });
  });
});

describe("管理アクションの認可(requireAdmin / AUTH-03)", () => {
  it("受講者セッションでは講座を作成できない", async () => {
    loginAs({ id: "u-1", role: "student" });

    const res = await createCourse(validCourseInput);

    expect(res).toEqual({ ok: false, error: "アクセス権限がありません" });
    expect(mocked.course.create).not.toHaveBeenCalled();
  });

  it("未認証では講座を作成できない", async () => {
    loginAs(null);

    const res = await createCourse(validCourseInput);

    expect(res).toEqual({ ok: false, error: "アクセス権限がありません" });
    expect(mocked.course.create).not.toHaveBeenCalled();
  });

  it("管理者なら講座を作成できる", async () => {
    loginAs({ id: "a-1", role: "admin" });
    mocked.course.create.mockResolvedValue({ id: "c-new" } as never);

    const res = await createCourse(validCourseInput);

    expect(res).toEqual({ ok: true, id: "c-new" });
  });
});
