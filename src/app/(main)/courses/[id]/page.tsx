// ============================================================
// Manabi LMS — 講座詳細 (STU-03) (Server Component)
// ============================================================
import { notFound, redirect } from "next/navigation";
import { getActingUser, getCourseDetail } from "@/lib/dal";
import { CourseDetailView } from "@/components/course/CourseDetailView";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const acting = await getActingUser();
  if (!acting) redirect("/login");
  if (acting.actingUser.role === "admin") redirect("/admin");

  const course = await getCourseDetail(id, acting.actingUser.id);
  if (!course) notFound();

  return <CourseDetailView course={course} />;
}
