import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { CIVIC_ACCESSOPS_NAV } from "@/components/accessops/page-content";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CivicAccessOpsPage() {
  await requireAuth();
  return (
    <AccessOpsPageShell
      title="Civic access operations"
      description="Operate civic access assets, status, incidents, work orders, reliability, sensors, webhooks, and reports from one accessible shell."
      navItems={[...CIVIC_ACCESSOPS_NAV]}
    />
  );
}
