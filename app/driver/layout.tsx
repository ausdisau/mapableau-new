import { PortalShell } from "@/components/core/PortalShell";
import { requireAuth } from "@/lib/auth/guards";

import { PORTAL_MODULES } from "@/lib/platform/portal-nav";

export const dynamic = "force-dynamic";

const driver = PORTAL_MODULES.driver;

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      title={driver.title}
      links={driver.links}
      logoHref={driver.logoHref}
      guard={requireAuth}
      mainClassName="px-4 py-4 pb-20"
    >
      {children}
    </PortalShell>
  );
}
