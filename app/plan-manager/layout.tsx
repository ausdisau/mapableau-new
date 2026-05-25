import { PwaAppLayout } from "@/components/layout/PwaAppLayout";
import { requirePermission } from "@/lib/auth/guards";

export default async function PlanManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("plan_manager:portal");
  return <PwaAppLayout>{children}</PwaAppLayout>;
}
