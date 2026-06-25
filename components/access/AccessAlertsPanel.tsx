"use client";

type Alert = {
  id: string;
  alertType: string;
  title: string;
  description?: string | null;
  status: string;
  expiresAt?: string | null;
};

export function AccessAlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <section aria-labelledby="access-alerts-heading">
        <h2 id="access-alerts-heading" className="text-lg font-semibold">
          Access alerts
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No active access alerts for this place.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="access-alerts-heading">
      <h2 id="access-alerts-heading" className="text-lg font-semibold">
        Active access alerts ({alerts.length})
      </h2>
      <ul className="mt-3 space-y-3">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
          >
            <p className="font-medium">{a.title}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {a.alertType.replace(/_/g, " ")} · {a.status}
            </p>
            {a.description ? (
              <p className="mt-1 text-sm">{a.description}</p>
            ) : null}
            {a.expiresAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {new Date(a.expiresAt).toLocaleDateString()}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
