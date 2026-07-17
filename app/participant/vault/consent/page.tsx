import { requirePermission } from "@/lib/auth/guards";
import { listActiveDirectivesForSubject } from "@/lib/consent-v2/directives";

export const dynamic = "force-dynamic";

export default async function VaultConsentPage() {
  const user = await requirePermission("consent_directive:read:self");
  const directives = await listActiveDirectivesForSubject(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Your consent directives</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        Directives are the record of what you have permitted. Revoking a
        directive creates a new withdrawn version — history is preserved.
      </p>
      {directives.length === 0 ? (
        <p className="text-sm">No active directives.</p>
      ) : (
        <ul className="space-y-2">
          {directives.map((d) => (
            <li key={d.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{d.purposeDetail}</div>
              <div>Purpose: {d.purpose}</div>
              <div>Recipient: {d.recipientCategory}</div>
              <div>Frequency: {d.frequency}</div>
              <div>Decision: {d.decision}</div>
              {d.effectiveUntil ? (
                <div>Expires: {d.effectiveUntil.toISOString().slice(0, 10)}</div>
              ) : (
                <div>Ongoing</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
