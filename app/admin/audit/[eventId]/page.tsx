import { requirePrivilegedAuditAccess } from "@/lib/auth/guards";
import { getAuditLogById } from "@/lib/audit/audit-service";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { notFound } from "next/navigation";

export const metadata = { title: "Audit event | Admin" };

export default async function AdminAuditDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requirePrivilegedAuditAccess();
  const { eventId } = await params;

  const event = await getAuditLogById(eventId);
  if (!event) notFound();

  await logDataAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "AuditLog",
    entityId: eventId,
    participantId: event.participantId ?? undefined,
    sensitivityLevel: "restricted",
    accessReason: "Privileged audit detail view",
    result: "allowed",
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Audit event</h1>
        <p className="text-sm text-muted-foreground">
          <code>{event.action}</code> · {event.domain}
        </p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Entity</dt>
          <dd>
            {event.entityType} {event.entityId}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Risk / outcome</dt>
          <dd>
            {event.riskLevel} / {event.outcome}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">When</dt>
          <dd>{new Date(event.createdAt).toLocaleString("en-AU")}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Actor</dt>
          <dd>{event.actorUser?.name ?? "System"}</dd>
        </div>
        {event.reason ? (
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Reason</dt>
            <dd>{event.reason}</dd>
          </div>
        ) : null}
      </dl>
      {(event.beforeJson || event.afterJson) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {event.beforeJson ? (
            <section>
              <h2 className="font-medium">Before (redacted)</h2>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(event.beforeJson, null, 2)}
              </pre>
            </section>
          ) : null}
          {event.afterJson ? (
            <section>
              <h2 className="font-medium">After (redacted)</h2>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(event.afterJson, null, 2)}
              </pre>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
