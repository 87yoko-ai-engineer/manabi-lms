// ============================================================
// Manabi LMS — モックデータ層(要件定義書 updated_2 §7 ER図・§13 デモ講座ラインナップ準拠)
// バックエンド導入時はこのモジュールを Prisma クエリに差し替える。
// 型のフィールド名は将来の Prisma スキーマと一致させている。
// ============================================================

export type Role = "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** UI表示用(アバター) */
  initials: string;
  color: string;
}

export interface Unit {
  id: string;
  title: string;
  /** 学習時間目安(分) = estimatedMinutes */
  estimatedMinutes: number;
  youtubeVideoId: string;
}

export interface Chapter {
  id: string;
  title: string;
  units: Unit[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tag: "必須" | "任意";
  description: string;
  goals: string[];
  publishStart: string; // "YYYY/MM/DD"
  publishEnd: string;
  /** UI表示用 */
  accent: string;
  cover: string;
  coverLabel: string;
  chapters: Chapter[];
}

export interface Enrollment {
  userId: string;
  courseId: string;
  enrollStart: string;
  enrollEnd: string;
}

// ---- Users -------------------------------------------------
export const USERS: User[] = [
  { id: "u-admin", name: "管理者 太郎", email: "admin@example.com", role: "admin", isActive: true, initials: "管", color: "#1F2A5B" },
  { id: "u-1", name: "佐藤 美咲", email: "sato@example.com", role: "student", isActive: true, initials: "佐", color: "#3B5BDB" },
  { id: "u-2", name: "鈴木 健一", email: "suzuki@example.com", role: "student", isActive: true, initials: "鈴", color: "#1098AD" },
  { id: "u-3", name: "田中 陽子", email: "tanaka@example.com", role: "student", isActive: true, initials: "田", color: "#E8590C" },
  { id: "u-4", name: "高橋 大輔", email: "takahashi@example.com", role: "student", isActive: false, initials: "高", color: "#868E96" },
  { id: "u-5", name: "渡辺 さくら", email: "watanabe@example.com", role: "student", isActive: true, initials: "渡", color: "#6741D9" },
];

// 動画ユニットを作るヘルパー
function v(id: string, title: string, min: number, vid: string): Unit {
  return { id, title, estimatedMinutes: min, youtubeVideoId: vid };
}

// ---- Courses → Chapters → Units ----------------------------
export const COURSES: Course[] = [
  {
    id: "c-1",
    title: "AI時代に必須 APIとは?",
    subtitle: "世界一わかりやすく解説",
    category: "API・基礎",
    tag: "必須",
    description: "APIの基本概念をやさしく理解し、APIキーの取得から Claude / Gemini API の呼び出しまでを体験します。AIを使いこなす土台となる「外部サービスとの連携」を最初の一歩から学びます。",
    goals: ["APIの基本概念を理解する", "APIキーを取得できる", "Claude / Gemini API を利用できる"],
    publishStart: "2026/04/01", publishEnd: "2027/03/31",
    accent: "#3B5BDB", cover: "linear-gradient(135deg,#2B45B0 0%,#3B5BDB 55%,#5C7CFA 100%)", coverLabel: "API",
    chapters: [
      { id: "ch-1-1", title: "Chapter 01 — APIの基礎を理解する", units: [
        v("un-1-1-1", "AI時代に必須 APIとは? 世界一わかりやすく解説", 18, "q3u8XFgf6fU"),
        v("un-1-1-2", "Google AI Studio 徹底解説", 16, "K054UMTtANE"),
      ]},
    ],
  },
  {
    id: "c-2",
    title: "Claude Code 超入門",
    subtitle: "知っておくべきコマンド",
    category: "AIコーディング",
    tag: "必須",
    description: "AIコーディングの主役 Claude Code を導入し、基本コマンドを押さえながら「AIと一緒に開発する」感覚を身につけます。自分専用ツールの開発を通じて、できることの広さを体感します。",
    goals: ["Claude Code を導入する", "基本コマンドを理解する", "AIと協力して開発できる"],
    publishStart: "2026/04/01", publishEnd: "2027/03/31",
    accent: "#1098AD", cover: "linear-gradient(135deg,#0C8599 0%,#1098AD 55%,#22B8CF 100%)", coverLabel: "CC",
    chapters: [
      { id: "ch-2-1", title: "Chapter 01 — Claude Code をはじめる", units: [
        v("un-2-1-1", "Claude Code 超入門 知っておくべきコマンド", 17, "dsVEVt6xZI4"),
        v("un-2-1-2", "Claude Code 実践 自分専用ツールを開発", 22, "M6O9mh8oLQ0"),
        v("un-2-1-3", "Claude Code 神機能9選", 19, "CcZjTpUM6eg"),
      ]},
    ],
  },
  {
    id: "c-3",
    title: "AIコーディング実践",
    subtitle: "Webアプリを作る",
    category: "AIコーディング",
    tag: "必須",
    description: "最強のAIコーディング環境を整え、実際にWebサイト・Webアプリを開発します。AIに任せる部分と自分が判断する部分の役割分担を、手を動かしながら理解します。",
    goals: ["AIコーディング環境を構築する", "Webアプリを開発する", "AIとの役割分担を理解する"],
    publishStart: "2026/05/01", publishEnd: "2027/04/30",
    accent: "#6741D9", cover: "linear-gradient(135deg,#5F3DC4 0%,#6741D9 55%,#845EF7 100%)", coverLabel: "AI",
    chapters: [
      { id: "ch-3-1", title: "Chapter 01 — 環境を整え、Webアプリを作る", units: [
        v("un-3-1-1", "AIコーディングにはこの環境が最強", 16, "2KdZrR2HahE"),
        v("un-3-1-2", "Claude Code 実演 Webサイト作成", 35, "X32pPFe5EIU"),
        v("un-3-1-3", "Claude Code でデザイン爆上げする神連携", 20, "Yxg2AcXJ9Qk"),
      ]},
    ],
  },
  {
    id: "c-4",
    title: "プログラミング不要でAIアプリ開発",
    subtitle: "ノーコードで本格アプリ",
    category: "ノーコード開発",
    tag: "任意",
    description: "コードを書かずに、AIだけで本格的なアプリを開発します。MVP(最小限の動くもの)を素早く作り、UIを整え、公開できる状態まで仕上げる一連の流れを学びます。",
    goals: ["MVPを構築する", "UI/UXを改善する", "公開可能なアプリを作成する"],
    // 公開開始が未来 = 公開期間外(バッジ表示デモ)
    publishStart: "2026/07/01", publishEnd: "2027/06/30",
    accent: "#E8590C", cover: "linear-gradient(135deg,#D9480F 0%,#E8590C 55%,#FD7E14 100%)", coverLabel: "APP",
    chapters: [
      { id: "ch-4-1", title: "Chapter 01 — ノーコードでアプリを形にする", units: [
        v("un-4-1-1", "プログラミング不要 AIで本格アプリ開発", 21, "agTtPZl2Dyk"),
        v("un-4-1-2", "Google AI Studio Webデザイン作成ツール 完全解説", 19, "qyZsqx3hP84"),
        v("un-4-1-3", "AI感のないデザイン作成", 15, "uWeKFzy5aus"),
      ]},
    ],
  },
  {
    id: "c-5",
    title: "Agent Skills を作る",
    subtitle: "自分専用AIを構築",
    category: "AIエージェント",
    tag: "任意",
    description: "Agent Skills を作成し、AIエージェントを設計して、業務自動化ワークフローを構築します。これまでの学びを統合し、自分の業務に合わせた「自分専用AI」を組み上げる最終講座です。",
    goals: ["Skills を作成する", "AIエージェントを設計する", "業務自動化ワークフローを構築する"],
    publishStart: "2026/05/01", publishEnd: "2027/04/30",
    accent: "#0CA678", cover: "linear-gradient(135deg,#087F5B 0%,#0CA678 55%,#20C997 100%)", coverLabel: "SKL",
    chapters: [
      { id: "ch-5-1", title: "Chapter 01 — Skills とエージェントを設計する", units: [
        v("un-5-1-1", "Agent Skills作成 超入門", 16, "3KhJCMYxRs0"),
        v("un-5-1-2", "Claude Skills 実演 オリジナルSkills作成", 23, "tRJdn5MPefE"),
        v("un-5-1-3", "Claude Managed Agents 完全解説", 25, "_fMxK74D1f0"),
      ]},
    ],
  },
];

// ---- Enrollments (受講者 × 講座) + 受講期間 -----------------
// デモ基準日の想定: 2026/06/10
export const ENROLLMENTS: Enrollment[] = [
  // 佐藤(A): 講座1修了・講座2受講中(+講座4は公開期間外バッジのデモ用に割当)
  { userId: "u-1", courseId: "c-1", enrollStart: "2026/04/15", enrollEnd: "2026/12/15" },
  { userId: "u-1", courseId: "c-2", enrollStart: "2026/04/15", enrollEnd: "2026/12/15" },
  { userId: "u-1", courseId: "c-4", enrollStart: "2026/06/01", enrollEnd: "2026/12/31" },
  // 鈴木(B): 講座1〜3修了
  { userId: "u-2", courseId: "c-1", enrollStart: "2026/04/01", enrollEnd: "2026/12/31" },
  { userId: "u-2", courseId: "c-2", enrollStart: "2026/04/01", enrollEnd: "2026/12/31" },
  { userId: "u-2", courseId: "c-3", enrollStart: "2026/05/01", enrollEnd: "2026/12/31" },
  // 田中(C): 講座1のみ受講中(※受講期間が終了 = 受講期間外バッジのデモ)
  { userId: "u-3", courseId: "c-1", enrollStart: "2026/01/01", enrollEnd: "2026/05/31" },
  // 高橋(D・無効アカウント): 全講座未着手
  { userId: "u-4", courseId: "c-1", enrollStart: "2026/06/01", enrollEnd: "2026/12/31" },
  { userId: "u-4", courseId: "c-2", enrollStart: "2026/06/01", enrollEnd: "2026/12/31" },
  { userId: "u-4", courseId: "c-3", enrollStart: "2026/06/01", enrollEnd: "2026/12/31" },
  { userId: "u-4", courseId: "c-4", enrollStart: "2026/06/01", enrollEnd: "2026/12/31" },
  { userId: "u-4", courseId: "c-5", enrollStart: "2026/06/01", enrollEnd: "2026/12/31" },
  // 渡辺(E): 全講座修了(c-4は公開期間外のため割当対象外。c-1,2,3,5を修了)
  { userId: "u-5", courseId: "c-1", enrollStart: "2026/03/01", enrollEnd: "2027/02/28" },
  { userId: "u-5", courseId: "c-2", enrollStart: "2026/03/01", enrollEnd: "2027/02/28" },
  { userId: "u-5", courseId: "c-3", enrollStart: "2026/03/01", enrollEnd: "2027/02/28" },
  { userId: "u-5", courseId: "c-5", enrollStart: "2026/03/01", enrollEnd: "2027/02/28" },
];

// ---- helpers ----------------------------------------------
export function courseUnitIds(course: Course): string[] {
  return course.chapters.flatMap((ch) => ch.units.map((u) => u.id));
}
export function courseUnits(course: Course): Unit[] {
  return course.chapters.flatMap((ch) => ch.units);
}
export function courseTotalMinutes(course: Course): number {
  return courseUnits(course).reduce((s, u) => s + u.estimatedMinutes, 0);
}
export function findCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId);
}
export function findUnit(unitId: string): { course: Course; chapter: Chapter; unit: Unit } | null {
  for (const c of COURSES)
    for (const ch of c.chapters)
      for (const u of ch.units)
        if (u.id === unitId) return { course: c, chapter: ch, unit: u };
  return null;
}
export function enrolledCourses(userId: string): Course[] {
  const ids = ENROLLMENTS.filter((e) => e.userId === userId).map((e) => e.courseId);
  return COURSES.filter((c) => ids.includes(c.id));
}

// ---- 初期 UnitProgress (受講者 × 完了ユニット) -------------
function buildInitialProgress(): Record<string, string[]> {
  const all = (courseId: string) => courseUnitIds(findCourse(courseId)!);
  const firstN = (courseId: string, n: number) => all(courseId).slice(0, n);
  return {
    // 佐藤(A): c-1 全完了、c-2 を 2/3(受講中)
    "u-1": [...all("c-1"), ...firstN("c-2", 2)],
    // 鈴木(B): c-1, c-2, c-3 全完了
    "u-2": [...all("c-1"), ...all("c-2"), ...all("c-3")],
    // 田中(C): c-1 を 1/2(受講中・期間終了)
    "u-3": [...firstN("c-1", 1)],
    // 高橋(D): 未着手
    "u-4": [],
    // 渡辺(E): c-1, c-2, c-3, c-5 全完了
    "u-5": [...all("c-1"), ...all("c-2"), ...all("c-3"), ...all("c-5")],
  };
}
export const INITIAL_PROGRESS: Record<string, string[]> = buildInitialProgress();
