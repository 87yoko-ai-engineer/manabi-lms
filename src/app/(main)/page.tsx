// ============================================================
// Manabi LMS — 講座一覧(ホーム) STU-01,02 (Server Component)
// ============================================================
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getActingUser, getStudentCourses } from "@/lib/dal";
import { StudentHome } from "@/components/student/StudentHome";

export default async function HomePage() {
  const acting = await getActingUser();
  if (!acting) redirect("/login");
  // 管理者本人(なりすまし中でない)は管理画面へ
  if (acting.actingUser.role === "admin") redirect("/admin");

  const courses = await getStudentCourses(acting.actingUser.id);

  return (
    <Suspense>
      <StudentHome courses={courses} />
    </Suspense>
  );
}
