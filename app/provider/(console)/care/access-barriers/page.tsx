import { ProviderBarrierInbox } from "@/components/barrier-report/ProviderBarrierInbox";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { listProviderScopedBarrierReports } from "@/lib/barrier-report/tenancy";
import { isProviderBarrierInboxEnabled } from "@/lib/config/access-independence";

export const metadata = { title: "Access barrier reports | Provider" };

export default async function ProviderAccessBarriersPage() {
  const user = await requireAuth();
  const canManage = hasPermission(user.primaryRole, "care:manage:org");
  const inboxEnabled = isProviderBarrierInboxEnabled();

  const reports = inboxEnabled
    ? await listProviderScopedBarrierReports(user)
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Access barrier reports</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review community reports assigned to your organisation. Unassigned
          reports stay in platform moderation until place→organisation ownership
          exists. Reporter personal details stay private.
        </p>
        {!inboxEnabled ? (
          <p className="mt-2 text-sm text-amber-900" role="status">
            Provider barrier inbox is currently disabled (fail-closed). Platform
            moderators can still review reports via the admin route.
          </p>
        ) : null}
      </header>
      <ProviderBarrierInbox
        canManage={canManage}
        initialReports={reports.map((report) => ({
          ...report,
          imageUrl: null,
          observedAt: report.observedAt?.toISOString() ?? null,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
