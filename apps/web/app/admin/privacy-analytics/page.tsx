import { requireAdmin } from "@/lib/auth/guards";
import { listAnalyticsRuns } from "@/lib/privacy-preserving-analytics/analytics-service";

export default async function PrivacyAnalyticsPage() {
  await requireAdmin();
  const runs = await listAnalyticsRuns();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Privacy-preserving analytics</h1>
      <ul className="space-y-2">
        {runs.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            {r.runLabel} — {r.method} ({r.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
