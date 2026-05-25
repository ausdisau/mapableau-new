import { MobileDashboard } from "@/components/dashboard/MobileDashboard";
import { requirePermission } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

export const metadata = { title: "Plan manager | MapAble" };

export default async function PlanManagerHomePage() {
  const user = await requirePermission("plan_manager:portal");

  return (
    <MobileDashboard
      role={user.primaryRole as UserRole}
      userName={user.name ?? "there"}
    />
  );
}
