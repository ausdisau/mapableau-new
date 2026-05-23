import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { defaultDashboardPath } from "@/lib/auth/roles";

export default async function SettingsPage() {
  const user = await requireAuth();
  if (user.primaryRole === "mapable_admin") {
    redirect("/admin");
  }
  if (
    user.primaryRole === "provider_admin" ||
    user.primaryRole === "transport_operator"
  ) {
    redirect("/provider");
  }
  redirect("/dashboard/profile");
}
