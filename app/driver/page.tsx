import { redirect } from "next/navigation";

import { MobileDashboard } from "@/components/dashboard/MobileDashboard";
import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

export const metadata = { title: "Driver home | MapAble" };

export default async function DriverHomePage() {
  const user = await requireAuth();
  if (user.primaryRole !== "driver") {
    redirect("/dashboard");
  }

  return (
    <MobileDashboard
      role={user.primaryRole as UserRole}
      userName={user.name ?? "there"}
    />
  );
}
