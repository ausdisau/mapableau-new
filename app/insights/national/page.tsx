import { listPublishedNationalInsights } from "@/lib/national-insights/insights-service";

export default async function NationalInsightsPage() {
  const snapshots = await listPublishedNationalInsights();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">National insights</h1>
      <p className="text-muted-foreground">
        Aggregate, suppressed metrics only. No participant-identifiable data.
      </p>
      <ul className="space-y-4">
        {snapshots.map((s) => (
          <li key={s.id} className="rounded-lg border p-4">
            <h2 className="font-medium">{s.periodLabel}</h2>
            {s.suppressed ? (
              <p className="text-sm text-amber-800">Some metrics suppressed (small cell)</p>
            ) : null}
            <pre className="mt-2 overflow-x-auto text-xs">
              {JSON.stringify(s.metricsJson, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
