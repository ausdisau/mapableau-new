import { PanelSection } from "@/components/admin-panels/PanelSection";

export function ProviderAnalyticsDashboard({
  metrics,
}: {
  metrics: {
    pendingBookings: number;
    openQuotes: number;
    qualityOpen: number;
    serviceLogsReview: number;
  };
}) {
  const cards = [
    { label: "Pending bookings", value: metrics.pendingBookings },
    { label: "Open quotes", value: metrics.openQuotes },
    { label: "Quality signals", value: metrics.qualityOpen },
    { label: "Logs to review", value: metrics.serviceLogsReview },
  ];

  return (
    <PanelSection title="Analytics snapshot">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-muted/30 p-4 text-center"
          >
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </PanelSection>
  );
}
