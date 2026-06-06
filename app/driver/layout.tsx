import { DriverNav } from "@/components/layout/DriverNav";
import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <MapAbleRoleAppShell headerTitle="Driver" secondaryNav={<DriverNav />}>
      <div className="pb-20">{children}</div>
    </MapAbleRoleAppShell>
  );
}
