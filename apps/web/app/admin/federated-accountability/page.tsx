import { requireAdmin } from "@/lib/auth/guards";
import { listAccountabilityPartners } from "@/lib/federated-accountability/federation-partner-service";

export default async function FederatedAccountabilityPage() {
  await requireAdmin();
  const partners = await listAccountabilityPartners();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Federated accountability</h1>
      <ul className="space-y-2">
        {partners.map((p) => (
          <li key={p.id} className="rounded border p-3 text-sm">
            {p.partnerName} — {p.jurisdiction ?? "n/a"} — {p.scope}
          </li>
        ))}
      </ul>
    </div>
  );
}
