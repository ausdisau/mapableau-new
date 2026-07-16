import { requireAuth } from "@/lib/auth/guards";
import { isRightsLedgerEnabled, isRightsOsEnabled } from "@/lib/rights-os/config";
import { getRightsHistory } from "@/lib/rights-os/ledger/ledger-service";

export default async function RightsHistoryPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return <p>Rights ledger is not enabled.</p>;
  }

  const history = await getRightsHistory(user.id);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Disclosure history</h2>
      <p className="text-sm text-muted-foreground">
        A chronological record of data-use requests and rights events.
      </p>

      <section aria-labelledby="audit-events-heading">
        <h3 id="audit-events-heading" className="font-medium">
          Rights audit events
        </h3>
        {history.auditEvents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No rights events yet.</p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {history.auditEvents.map((event) => (
              <li key={event.id} className="p-3 text-sm">
                <p className="font-medium">{event.action}</p>
                <p className="text-muted-foreground">
                  {event.createdAt.toLocaleString("en-AU")}
                  {event.entityType ? ` · ${event.entityType}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="requests-heading">
        <h3 id="requests-heading" className="font-medium">
          Data-use requests
        </h3>
        {history.requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No data-use requests yet.</p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {history.requests.map((request) => (
              <li key={request.id} className="p-3 text-sm">
                <p className="font-medium">{request.purposeCode}</p>
                <p className="text-muted-foreground">
                  {request.recipientDisplayName} · {request.status}
                </p>
                {request.decisions[0] ? (
                  <p className="text-xs text-muted-foreground">
                    Outcome: {request.decisions[0].outcome}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
