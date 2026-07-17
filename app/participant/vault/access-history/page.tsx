import { requirePermission } from "@/lib/auth/guards";
import { loadAccessHistoryForParticipant } from "@/lib/access-vault/disclosures";

export const dynamic = "force-dynamic";

export default async function VaultAccessHistoryPage() {
  const user = await requirePermission("vault:access-history:read:self");
  const history = await loadAccessHistoryForParticipant(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Access history</h1>
      <p className="text-sm">
        Every use of your data recorded via a directive. Withdrawing consent
        does not remove past events — it stops future ones.
      </p>
      {history.length === 0 ? (
        <p className="text-sm">No access events recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((h, idx) => (
            <li key={idx} className="rounded border p-3 text-sm">
              <div className="font-medium">
                {h.actorLabel} · {h.purpose}
              </div>
              <div>Action: {h.action}</div>
              <div>Outcome: {h.outcome}</div>
              <div>When: {h.createdAt.toISOString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
