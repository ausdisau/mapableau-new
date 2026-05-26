import { PortalShell } from "@/components/core/PortalShell";
import { requirePermission } from "@/lib/auth/guards";

import { PORTAL_MODULES } from "@/lib/platform/portal-nav";

export const dynamic = "force-dynamic";

const worker = PORTAL_MODULES.worker;

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      title={worker.title}
      links={worker.links}
      logoHref={worker.logoHref}
      guard={() => requirePermission("care:shift:work")}
    >
      {children}
    </PortalShell>
  );
}
