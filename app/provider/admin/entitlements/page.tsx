import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderEntitlementsPage() {
  const user = await requirePermission("tenant:entitlements:read");
  const orgIds = await getUserOrganisationIds(user.id);
  const entitlements = await prisma.tenantFeatureEntitlement.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: [{ organisationId: "asc" }, { featureKey: "asc" }],
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Entitlements</h1>
        <p className="mt-2 max-w-3xl text-sm">
          A feature requires <em>all</em> of: env flag on, entitlement active,
          assurance ready, and (for production) an executive GA decision. Env
          flags alone do NOT enable a feature.
        </p>
      </header>
      {entitlements.length === 0 ? (
        <p>No entitlements. Speak to your MapAble account manager.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entitlements.map((e) => (
            <li key={e.id}>
              {e.featureKey} · {e.environment} · {e.status}
              {e.expiresAt ? ` · expires ${e.expiresAt.toISOString()}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
