import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderQuotasPage() {
  const user = await requirePermission("tenant:quotas:read");
  const orgIds = await getUserOrganisationIds(user.id);
  const quotas = await prisma.tenantQuotaProfile.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { profileKey: "asc" },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Quotas</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Quotas cap features that you are already entitled to. They do not
          themselves enable a feature.
        </p>
      </header>
      {quotas.length === 0 ? (
        <p>No quota profiles configured.</p>
      ) : (
        <ul className="text-sm">
          {quotas.map((q) => (
            <li key={q.id}>
              {q.profileKey} · active={String(q.active)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
