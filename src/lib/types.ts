// ============================================================
// Manabi LMS — サーバー→クライアント受け渡し用DTO型
// (シリアライズ可能なプレーンオブジェクトのみ。日付は "YYYY/MM/DD" 文字列)
// ============================================================

export type Role = "admin" | "student";

/** UI表示用ユーザー(アバターの頭文字・色つき) */
export interface UiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  initials: string;
  color: string;
}

/** 公開期間・受講期間の判定結果 (STU-08 / ERR-07,08) */
export interface AccessInfo {
  viewable: boolean;
  label: string | null;
  msg: string | null;
}

/** 講座一覧カード用 */
export interface CourseListItem {
  id: string;
  title: string;
  category: string;
  tag: string;
  description: string;
  publishStart: string;
  publishEnd: string;
  accent: string;
  cover: string;
  coverLabel: string;
  chaptersCount: number;
  minutes: number;
  pct: number;
  access: AccessInfo;
}

/** 講座詳細用 */
export interface CourseDetailDTO {
  id: string;
  title: string;
  category: string;
  tag: string;
  description: string;
  goals: string[];
  publishStart: string;
  publishEnd: string;
  accent: string;
  cover: string;
  coverLabel: string;
  minutes: number;
  pct: number;
  access: AccessInfo;
  doneCount: number;
  unitCount: number;
  nextUnitId: string | null;
  chapters: {
    id: string;
    title: string;
    units: { id: string; title: string; estimatedMinutes: number; done: boolean }[];
  }[];
}

/** ユニット視聴ページ用 */
export interface UnitViewDTO {
  course: { id: string; title: string };
  chapter: { id: string; title: string };
  unit: { id: string; title: string; estimatedMinutes: number; youtubeVideoId: string };
  done: boolean;
  access: AccessInfo;
  index: number;
  total: number;
  prevId: string | null;
  nextId: string | null;
  sidebar: {
    id: string;
    title: string;
    units: { id: string; title: string; estimatedMinutes: number; done: boolean }[];
  }[];
}

/** 管理ダッシュボード用 */
export interface AdminDashboardDTO {
  kpis: {
    activeStudents: number;
    inactiveStudents: number;
    courseCount: number;
    unitCount: number;
    overallAvg: number;
    completedEnroll: number;
    totalEnroll: number;
  };
  courseStats: {
    id: string;
    title: string;
    accent: string;
    coverLabel: string;
    enrolled: number;
    avg: number;
    doneN: number;
  }[];
  students: {
    user: UiUser;
    cells: ({ pct: number } | null)[]; // courseStats と同順。null = 未割当
    avg: number;
  }[];
}

/** 講座管理テーブル用 */
export interface AdminCourseRow {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tag: string;
  cover: string;
  coverLabel: string;
  chaptersCount: number;
  unitCount: number;
  minutes: number;
  publishStart: string;
  publishEnd: string;
}

/** 受講者管理テーブル用 */
export interface AdminStudentRow {
  user: UiUser;
  enrollCount: number;
  range: string;
}

/** 講座編集フォーム用(日付は <input type="date"> 形式 "YYYY-MM-DD") */
export interface AdminCourseEdit {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tag: string;
  description: string;
  goals: string[];
  publishStart: string;
  publishEnd: string;
  accent: string;
  coverLabel: string;
  chapters: {
    id: string;
    title: string;
    units: { id: string; title: string; youtubeVideoId: string; estimatedMinutes: number }[];
  }[];
}

/** 講座割り当て画面用 */
export interface EnrollmentEditorData {
  student: UiUser;
  rows: {
    courseId: string;
    title: string;
    coverLabel: string;
    cover: string;
    category: string;
    publishRange: string;
    /** 公開期間("YYYY-MM-DD"。受講期間との整合チェック用) */
    publishStart: string;
    publishEnd: string;
    /** 割当済みなら "YYYY-MM-DD"、未割当なら null */
    enrollStart: string | null;
    enrollEnd: string | null;
  }[];
}
