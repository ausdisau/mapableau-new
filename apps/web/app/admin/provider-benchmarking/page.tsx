import { requireAdmin } from "@/lib/auth/guards";
import { getProviderBenchmarkDashboard } from "@/lib/provider-benchmarking/benchmark-service";

export default async function ProviderBenchmarkingPage() {
  await requireAdmin();
  const data = await getProviderBenchmarkDashboard();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider benchmarking</h1>
      <p className="text-sm text-muted-foreground">{data.disclaimer}</p>
      <ul className="space-y-2">
        {data.snapshots.map((s) => (
          <li key={s.id} className="rounded border p-3 text-sm">
            {s.metricKey} — {s.suppressed ? "suppressed" : s.displayValue} (
            {s.periodLabel})
          </li>
        ))}
      </ul>
    </div>
  );
}
