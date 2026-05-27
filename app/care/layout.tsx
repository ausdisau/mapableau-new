import { PortalShell } from "@/components/core/PortalShell";
import { requirePermission } from "@/lib/auth/guards";

import { PORTAL_MODULES } from "@/lib/platform/portal-nav";

export const dynamic = "force-dynamic";

const care = PORTAL_MODULES.care;

export default async function CareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      title={care.title}
      links={care.links}
      logoHref={care.logoHref}
      guard={() => requirePermission("care:read:self")}
    >
      {children}
    </PortalShell>
  );
}
