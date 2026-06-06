import { AdminNav } from "@/components/layout/AdminNav";
import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { requireAdminOpsAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOpsAccess();

  return (
    <MapAbleRoleAppShell headerTitle="Admin" secondaryNav={<AdminNav />}>
      {children}
    </MapAbleRoleAppShell>
  );
}
