import { CareNav } from "@/components/care/CareNav";
import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { requirePermission } from "@/lib/auth/guards";

export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("care:read:self");

  return (
    <MapAbleRoleAppShell headerTitle="Care" secondaryNav={<CareNav />}>
      {children}
    </MapAbleRoleAppShell>
  );
}
