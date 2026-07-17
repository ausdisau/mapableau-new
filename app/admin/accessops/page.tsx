import { AccessOpsPageShell } from "@/components/accessops/AccessOpsPageShell";
import { ADMIN_ACCESSOPS_NAV } from "@/components/accessops/page-content";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminAccessOpsPage() {
  await requirePermission("admin:dashboard");
  return (
    <AccessOpsPageShell
      admin
      title="AccessOps command centre"
      description="Admin shell for civic access digital twin operations, reliability, partner API scopes, open-data controls, and assurance gates."
      navItems={[...ADMIN_ACCESSOPS_NAV]}
      rows={[
        {
          label: "Assets",
          value: "Requires auth",
          note: "Counts load through authenticated APIs; restricted geometry is not public.",
        },
        {
          label: "Status and reliability",
          value: "Requires auth",
          note: "Unknown and stale windows remain explicit in reports.",
        },
        {
          label: "Participant journeys",
          value: "Not shown",
          note: "Dashboards avoid individual journey and profile data.",
        },
      ]}
    />
  );
}
