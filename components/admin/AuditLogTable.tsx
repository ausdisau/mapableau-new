export interface AuditLogRow {
  id: string;
  action: string;
  domain?: string | null;
  entityType: string;
  entityId: string | null;
  riskLevel?: string | null;
  createdAt: string | Date;
  actorUser?: { name: string; email: string } | null;
}

export function AuditLogTable({ events }: { events: AuditLogRow[] }) {
  if (!events.length) {
    return <p className="text-muted-foreground">No audit logs found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Audit logs</caption>
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              When
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Action
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Domain
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Entity
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Risk
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Actor
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-border">
              <td className="px-4 py-3 whitespace-nowrap">
                <time dateTime={new Date(event.createdAt).toISOString()}>
                  {new Date(event.createdAt).toLocaleString("en-AU")}
                </time>
              </td>
              <td className="px-4 py-3">
                <a href={`/admin/audit/${event.id}`} className="hover:underline">
                  <code className="text-xs">{event.action}</code>
                </a>
              </td>
              <td className="px-4 py-3">{event.domain ?? "—"}</td>
              <td className="px-4 py-3">
                {event.entityType}
                {event.entityId ? ` (${event.entityId.slice(0, 8)}…)` : ""}
              </td>
              <td className="px-4 py-3">{event.riskLevel ?? "low"}</td>
              <td className="px-4 py-3">{event.actorUser?.name ?? "System"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
