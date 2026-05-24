import { requireAdmin } from "@/lib/auth/guards";
import { listRetentionPolicies } from "@/lib/privacy/data-retention-service";

export const metadata = { title: "Data retention | Admin" };

export default async function DataRetentionPage() {
  await requireAdmin();
  const policies = await listRetentionPolicies().catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Data retention</h1>
      <p className="text-muted-foreground">
        Retention jobs run as dry-run by default until admin review approves deletion.
      </p>
      <ul className="divide-y rounded-lg border">
        {policies.length === 0 ? (
          <li className="p-4 text-sm">No policies configured yet.</li>
        ) : (
          policies.map((p) => (
            <li key={p.id} className="flex justify-between p-4 text-sm">
              <span>{p.entityType}</span>
              <span>{p.retainDays} days</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
