import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { listAuditLogs } from "@/lib/audit/audit-service";

export const metadata = { title: "Quality audit" };

export default async function QualityAuditPage() {
  const events = await listAuditLogs({ domain: "quality", limit: 50 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Quality audit trail</h1>
        <p className="mt-1 text-muted-foreground">
          Domain-filtered audit events for quality and safeguarding.
        </p>
      </header>
      <AuditLogTable events={events} />
    </div>
  );
}
