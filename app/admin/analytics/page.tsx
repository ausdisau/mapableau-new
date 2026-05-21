import { AnalyticsMetricCard } from "@/components/phase4/AnalyticsMetricCard";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
} from "@/lib/analytics/admin-analytics-service";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const data = await getAnalyticsSummary();

  if ("disabled" in data && data.disabled) {
    return <p>Analytics disabled.</p>;
  }

  const summary = data as Extract<AnalyticsSummary, { care: unknown }>;
  const { care, transport } = summary;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Service analytics</h1>
        <p className="text-muted-foreground">
          Aggregate metrics only. Table view provided for screen readers.
        </p>
      </header>
      <section>
        <h2 className="font-heading text-xl font-semibold">Care</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(care).map(([key, m]) => (
            <AnalyticsMetricCard
              key={key}
              title={key}
              value={m.value}
              definition={m.definition}
            />
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-heading text-xl font-semibold">Transport</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(transport).map(([key, m]) => (
            <AnalyticsMetricCard
              key={key}
              title={key}
              value={m.value}
              definition={m.definition}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
