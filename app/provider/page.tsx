import { redirect } from "next/navigation";

import { MobileDashboard } from "@/components/dashboard/MobileDashboard";
import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

export const metadata = { title: "Provider home | MapAble" };

export default async function ProviderHomePage() {
  const user = await requireAuth();
  if (
    user.primaryRole !== "provider_admin" &&
    user.primaryRole !== "transport_operator"
  ) {
    redirect("/dashboard");
  }

  return (
    <MobileDashboard
      role={user.primaryRole as UserRole}
      userName={user.name ?? "there"}
    />
  );
}
