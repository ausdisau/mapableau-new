import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { PlanManagerNav } from "@/components/layout/PlanManagerNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function PlanManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <MapAbleRoleAppShell headerTitle="Plan manager" secondaryNav={<PlanManagerNav />}>
      {children}
    </MapAbleRoleAppShell>
  );
}
