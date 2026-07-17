import { requirePermission } from "@/lib/auth/guards";
import {
  listAuthoritiesForParticipant,
} from "@/lib/delegation/authority";
import { summariseRelationship } from "@/lib/delegation/relationships";

export const dynamic = "force-dynamic";

export default async function VaultDelegatesPage() {
  const user = await requirePermission("delegate:read:self");
  const authorities = await listAuthoritiesForParticipant(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Your delegates</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        Relationships (like family or emergency contact) are not authority. A
        delegate can only act if you explicitly grant a category and the
        verification level matches.
      </p>
      {authorities.length === 0 ? (
        <p className="text-sm">You have no delegates on record.</p>
      ) : (
        <ul className="space-y-2">
          {authorities.map((a) => (
            <li key={a.id} className="rounded border p-3 text-sm">
              <div className="font-medium">
                {summariseRelationship(a.relationshipKind)}
              </div>
              <div>Status: {a.status}</div>
              <div>Verification: {a.verification}</div>
              <div>Categories: {a.authorityCategories.join(", ") || "none"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
