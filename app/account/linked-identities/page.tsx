import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { LinkedAccountsPanel } from "@/components/auth/LinkedAccountsPanel";
import { getLinkedIdentities } from "@/lib/auth/account-linking-service";
import { requireAuth } from "@/lib/auth/guards";

export default async function LinkedIdentitiesPage() {
  const user = await requireAuth("/login?returnTo=/account/linked-identities");
  const identities = await getLinkedIdentities(user.id);

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-bold">Linked sign-in methods</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage how you sign in to MapAble through Australian Disability Ltd
          identity services.
        </p>
        <div className="mt-6">
          <LinkedAccountsPanel
            identities={identities.map((identity) => ({
              ...identity,
              linkedAt: identity.linkedAt.toISOString(),
            }))}
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}
