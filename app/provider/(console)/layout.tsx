import { PortalNav } from "@/components/core/PortalNav";
import { AuthenticatedRoleAppShell } from "@/components/layout/AuthenticatedRoleAppShell";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { getProviderCenterNavLinks } from "@/lib/platform/core-ui/provider-center-nav";
import { normalizeProviderCenterPathname } from "@/lib/platform/core-ui/provider-path";
import { isBusinessHostRequest } from "@/lib/provider/business-request";

export const dynamic = "force-dynamic";

export default async function ProviderConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  await requirePermission("care:read:org");
  const onBusinessHost = await isBusinessHostRequest();
  const navLinks = getProviderCenterNavLinks(onBusinessHost);

  return (
    <AuthenticatedRoleAppShell
      user={user}
      headerTitle={onBusinessHost ? "Provider Center" : "Provider"}
      secondaryNav={
        <PortalNav
          title={onBusinessHost ? "Provider Center" : "Provider control panel"}
          links={navLinks}
          backHref="/dashboard"
          backLabel="Dashboard"
          normalizePathname={
            onBusinessHost ? normalizeProviderCenterPathname : undefined
          }
        />
      }
    >
      {children}
    </AuthenticatedRoleAppShell>
  );
}
