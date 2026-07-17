import { listMetricsForAdmin } from "@/lib/accountability/admin-reader";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminAccountabilityMetricsPage() {
  await requirePermission("accountability:manage_metrics");

  const rows = await listMetricsForAdmin();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Metric definitions</h1>
      <ul className="space-y-2">
        {rows.map((m) => (
          <li key={m.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{m.name} ({m.publicCode})</p>
            <p className="text-xs text-muted-foreground">{m.domain} · cohort ≥ {m.minimumCohortSize} · {m.methodology.title}</p>
          </li>
        ))}
      </ul>
    </div>
  );

}
