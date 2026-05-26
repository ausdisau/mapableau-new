import { PortalShell } from "@/components/core/PortalShell";
import { requireAuth } from "@/lib/auth/guards";

import { PORTAL_MODULES } from "@/lib/platform/portal-nav";

export const dynamic = "force-dynamic";

const employer = PORTAL_MODULES.employer;

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      title={employer.title}
      links={employer.links}
      logoHref={employer.logoHref}
      guard={requireAuth}
    >
      {children}
    </PortalShell>
  );
}
