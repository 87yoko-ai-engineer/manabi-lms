// ============================================================
// Manabi LMS — ユニット視聴 (STU-04,05) (Server Component)
// ============================================================
import { notFound, redirect } from "next/navigation";
import { getActingUser, getUnitView } from "@/lib/dal";
import { UnitViewClient } from "@/components/course/UnitViewClient";

export default async function UnitViewPage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id, unitId } = await params;
  const acting = await getActingUser();
  if (!acting) redirect("/login");
  if (acting.actingUser.role === "admin") redirect("/admin");

  const data = await getUnitView(id, unitId, acting.actingUser.id);
  if (!data) notFound();

  return <UnitViewClient data={data} />;
}
