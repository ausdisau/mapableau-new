import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date | string;
  actorUser?: { name: string | null; email: string | null } | null;
};

export function AuditTrailPanel({ events }: { events: AuditEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
        <CardDescription>
          Recent AbilityPay actions for accountability and review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">AbilityPay audit events</caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-2 pr-2">
                    When
                  </th>
                  <th scope="col" className="py-2 pr-2">
                    Action
                  </th>
                  <th scope="col" className="py-2 pr-2">
                    Entity
                  </th>
                  <th scope="col" className="py-2">
                    Actor
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border/40">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString("en-AU")}
                    </td>
                    <td className="py-2 pr-2">{event.action}</td>
                    <td className="py-2 pr-2">
                      {event.entityType}
                      {event.entityId ? ` · ${event.entityId.slice(0, 8)}…` : ""}
                    </td>
                    <td className="py-2">
                      {event.actorUser?.name ?? event.actorUser?.email ?? "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
