import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { requirePermission } from "@/lib/auth/guards";
import { listAuditLogs } from "@/lib/audit/audit-service";
import { logDataAccess } from "@/lib/audit/data-access-log-service";

export const metadata = { title: "Audit explorer | Admin" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; domain?: string }>;
}) {
  const user = await requirePermission("audit:read");
  const { action, domain } = await searchParams;

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "AuditLog",
    entityId: "explorer",
    sensitivityLevel: "confidential",
    accessReason: "Admin audit explorer page view",
    result: "allowed",
  });

  const events = await listAuditLogs({ action, domain, limit: 100 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Audit explorer</h1>
        <p className="mt-1 text-muted-foreground">
          Immutable append-only audit trail. Raw detail requires privileged access.
        </p>
        <form className="mt-4 flex flex-wrap gap-2">
          <input
            name="action"
            defaultValue={action}
            placeholder="Filter by action"
            className="min-h-11 rounded-lg border border-input px-3"
            aria-label="Filter by action"
          />
          <input
            name="domain"
            defaultValue={domain}
            placeholder="Filter by domain"
            className="min-h-11 rounded-lg border border-input px-3"
            aria-label="Filter by domain"
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
          >
            Filter
          </button>
        </form>
      </header>
      <AuditLogTable events={events} />
    </div>
  );
}
