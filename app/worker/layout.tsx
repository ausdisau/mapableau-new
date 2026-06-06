import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { WorkerNav } from "@/components/layout/WorkerNav";
import { requirePermission } from "@/lib/auth/guards";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:shift:work");

  return (
    <MapAbleRoleAppShell headerTitle="Worker" secondaryNav={<WorkerNav />}>
      {children}
    </MapAbleRoleAppShell>
  );
}
