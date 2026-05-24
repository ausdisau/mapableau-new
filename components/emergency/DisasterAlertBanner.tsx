type Alert = {
  id: string;
  title: string;
  summary: string;
  severity: string;
  regionCode: string;
};

export function DisasterAlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2" role="region" aria-label="Disaster alerts">
      {alerts.map((a) => (
        <div
          key={a.id}
          role="alert"
          className={`rounded-lg border p-4 ${
            a.severity === "emergency" || a.severity === "warning"
              ? "border-red-500/50 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-100"
              : "border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-950/20"
          }`}
        >
          <p className="font-medium">
            {a.title} ({a.regionCode})
          </p>
          <p className="mt-1 text-sm">{a.summary}</p>
        </div>
      ))}
    </div>
  );
}
