import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderPoliciesPage() {
  const user = await requirePermission("tenant:policies:read");
  const orgIds = await getUserOrganisationIds(user.id);
  const policies = await prisma.tenantPolicyProfile.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: [{ profileKey: "asc" }, { version: "desc" }],
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Tenant policies</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Policies are versioned. Only <code>active</code> profiles within
          their effective window take effect.
        </p>
      </header>
      {policies.length === 0 ? (
        <p>No policy profiles yet.</p>
      ) : (
        <ul className="text-sm">
          {policies.map((p) => (
            <li key={p.id}>
              {p.profileKey} v{p.version} · {p.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
