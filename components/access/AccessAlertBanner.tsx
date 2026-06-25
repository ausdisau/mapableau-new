import Link from "next/link";

const ALERT_LABELS: Record<string, string> = {
  broken_lift: "Broken lift",
  blocked_ramp: "Blocked ramp",
  inaccessible_toilet: "Inaccessible toilet",
  construction_barrier: "Construction barrier",
  inaccessible_transport_stop: "Inaccessible transport stop",
  temporary_closure: "Temporary closure",
  crowding_sensory_risk: "Crowding or sensory risk",
  urgent_hazard: "Urgent access hazard",
};

export function AccessAlertBanner({
  alerts,
  placeId,
}: {
  alerts: {
    id: string;
    alertType: string;
    title: string;
    description?: string | null;
    expiresAt?: Date | string | null;
  }[];
  placeId: string;
}) {
  if (!alerts.length) return null;

  return (
    <section
      aria-labelledby="active-alerts-heading"
      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"
    >
      <h2 id="active-alerts-heading" className="text-lg font-semibold">
        Active access alerts ({alerts.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {alerts.slice(0, 3).map((alert) => (
          <li key={alert.id} className="text-sm">
            <span className="font-medium">
              {ALERT_LABELS[alert.alertType] ?? alert.alertType}:{" "}
            </span>
            {alert.title}
            {alert.description ? (
              <span className="block text-muted-foreground">
                {alert.description}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {alerts.length > 3 ? (
        <Link
          href={`/access/places/${placeId}/alerts`}
          className="mt-2 inline-block text-sm underline"
        >
          View all alerts
        </Link>
      ) : null}
    </section>
  );
}
