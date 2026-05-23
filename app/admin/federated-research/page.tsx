import { requireAdmin } from "@/lib/auth/guards";
import { listFederatedAgreements } from "@/lib/federated-research/federation-service";

export default async function FederatedResearchPage() {
  await requireAdmin();
  const data = await listFederatedAgreements();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Federated research</h1>
      {data.disabled ? <p>FEDERATED_RESEARCH_ENABLED is false.</p> : null}
      <ul className="space-y-2">
        {data.agreements.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            {a.partnerName} — {a.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
