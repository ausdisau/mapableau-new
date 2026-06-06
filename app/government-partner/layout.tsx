import { GovernmentPartnerNav } from "@/components/layout/GovernmentPartnerNav";
import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function GovernmentPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <MapAbleRoleAppShell
      headerTitle="Government partner"
      secondaryNav={<GovernmentPartnerNav />}
    >
      {children}
    </MapAbleRoleAppShell>
  );
}
