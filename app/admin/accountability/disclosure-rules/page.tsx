import { listDisclosurePolicies } from "@/lib/accountability/admin-reader";
import { requirePermission } from "@/lib/auth/guards";

export default async function AdminAccountabilityDisclosureRulesPage() {
  await requirePermission("accountability:review_privacy");

  const rows = await listDisclosurePolicies();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Disclosure rules</h1>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id} className="rounded border p-3 text-sm">{p.name} · cohort ≥ {p.minimumCohortSize} · {p.sensitivity}</li>
        ))}
      </ul>
    </div>
  );

}
