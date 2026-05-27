import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { DataAccessLogTable } from "@/components/admin/DataAccessLogTable";
import { requirePermission } from "@/lib/auth/guards";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { listAuditLogs } from "@/lib/audit/audit-service";
import { listDataAccessLogs } from "@/lib/audit/data-access-log-service";

export const metadata = { title: "Provider audit" };

export default async function ProviderAuditPage() {
  const user = await requirePermission("audit:read:org");
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];

  if (!organisationId) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Organisation audit</h1>
        <p className="text-muted-foreground">No organisation linked to your account.</p>
      </div>
    );
  }

  const [events, accessLogs] = await Promise.all([
    listAuditLogs({ organisationId, limit: 50 }),
    listDataAccessLogs({ organisationId, limit: 50 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Organisation audit</h1>
        <p className="mt-1 text-muted-foreground">
          Audit and data access events scoped to your organisation only.
        </p>
      </header>
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Audit logs</h2>
        <AuditLogTable events={events} />
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Data access logs</h2>
        <DataAccessLogTable logs={accessLogs} />
      </section>
    </div>
  );
}
