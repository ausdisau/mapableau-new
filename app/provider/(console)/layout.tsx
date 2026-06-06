import { PortalNav } from "@/components/core/PortalNav";
import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { PROVIDER_NAV_LINKS } from "@/lib/core-ui/provider-nav";

export const dynamic = "force-dynamic";

export default async function ProviderConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  await requirePermission("care:read:org");

  return (
    <MapAbleRoleAppShell
      headerTitle="Provider"
      secondaryNav={
        <PortalNav
          title="Provider control panel"
          links={PROVIDER_NAV_LINKS}
          backHref="/dashboard"
          backLabel="Dashboard"
        />
      }
    >
      {children}
    </MapAbleRoleAppShell>
  );
}
