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

export function AccessAlertList({
  alerts,
  placeId,
}: {
  alerts: {
    id: string;
    alertType: string;
    title: string;
    description?: string | null;
    status: string;
    expiresAt?: string | null;
    createdAt: string;
  }[];
  placeId: string;
}) {
  if (!alerts.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No active alerts for this place.
      </p>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Access alerts">
      {alerts.map((alert) => (
        <li key={alert.id} className="rounded-lg border border-border p-4">
          <p className="font-medium">
            {ALERT_LABELS[alert.alertType] ?? alert.alertType}: {alert.title}
          </p>
          {alert.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {alert.description}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            Reported {new Date(alert.createdAt).toLocaleDateString("en-AU")}
            {alert.expiresAt
              ? ` · Expires ${new Date(alert.expiresAt).toLocaleDateString("en-AU")}`
              : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
