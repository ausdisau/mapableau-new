import { PortalShell } from "@/components/core/PortalShell";
import { requireAuth, requirePermission } from "@/lib/auth/guards";

import { PORTAL_MODULES } from "@/lib/platform/portal-nav";

export const dynamic = "force-dynamic";

const provider = PORTAL_MODULES.provider;

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      title={provider.title}
      links={provider.links}
      guard={async () => {
        await requireAuth();
        await requirePermission("care:read:org");
      }}
    >
      {children}
    </PortalShell>
  );
}
