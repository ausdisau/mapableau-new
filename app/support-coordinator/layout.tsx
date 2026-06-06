import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { SupportCoordinatorNav } from "@/components/layout/SupportCoordinatorNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function SupportCoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <MapAbleRoleAppShell
      headerTitle="Support coordinator"
      secondaryNav={<SupportCoordinatorNav />}
    >
      {children}
    </MapAbleRoleAppShell>
  );
}
