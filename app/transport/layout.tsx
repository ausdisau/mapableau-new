import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { TransportNav } from "@/components/layout/TransportNav";
import { requirePermission } from "@/lib/auth/guards";

export default async function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("transport:read:self");

  return (
    <MapAbleRoleAppShell headerTitle="Transport" secondaryNav={<TransportNav />}>
      {children}
    </MapAbleRoleAppShell>
  );
}
