"use client";

import { RoleDashboardGrid } from "@/components/dashboard/RoleDashboardGrid";
import { OfflineReadyCard } from "@/components/dashboard/OfflineReadyCard";
import type { NavRoleKey } from "@/lib/navigation/role-navigation";
import { resolveNavRoleKey } from "@/lib/navigation/role-navigation";
import type { UserRole } from "@/types/mapable";

import { AdminDashboardContent } from "./role-content/AdminDashboardContent";
import { DriverDashboardContent } from "./role-content/DriverDashboardContent";
import { ParticipantDashboardContent } from "./role-content/ParticipantDashboardContent";
import { PlanManagerDashboardContent } from "./role-content/PlanManagerDashboardContent";
import { ProviderDashboardContent } from "./role-content/ProviderDashboardContent";
import { WorkerDashboardContent } from "./role-content/WorkerDashboardContent";

export function MobileDashboard({
  role,
  userName,
}: {
  role: UserRole;
  userName: string;
}) {
  const key: NavRoleKey = resolveNavRoleKey(role);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Hello, {userName}</h1>
        <p className="text-sm text-muted-foreground">
          Your MapAble control room
        </p>
      </header>
      <OfflineReadyCard />
      <RoleDashboardGrid>
        {key === "participant" && <ParticipantDashboardContent />}
        {key === "provider_admin" && <ProviderDashboardContent />}
        {key === "support_worker" && <WorkerDashboardContent />}
        {key === "driver" && <DriverDashboardContent />}
        {key === "plan_manager" && <PlanManagerDashboardContent />}
        {key === "admin" && <AdminDashboardContent />}
      </RoleDashboardGrid>
    </div>
  );
}
