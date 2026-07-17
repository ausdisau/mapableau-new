import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderOrganisationAdminPage() {
  const user = await requirePermission("tenant:admin:read");
  const orgIds = await getUserOrganisationIds(user.id);
  const orgs = await prisma.organisation.findMany({
    where: { id: { in: orgIds } },
    select: {
      id: true,
      name: true,
      tenantKey: true,
      tenantType: true,
      tenantStatus: true,
      operatingModel: true,
      jurisdiction: true,
      dataRegion: true,
    },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your organisation</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Tenant status is operational metadata. Enabling an environment or a
          flag does not enable a feature — you also need an entitlement.
        </p>
      </header>
      {orgs.length === 0 ? (
        <p>No organisations available. Contact MapAble support.</p>
      ) : (
        orgs.map((o) => (
          <section key={o.id} className="rounded border p-3">
            <h2 className="font-semibold">{o.name}</h2>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <dt>Tenant key</dt>
              <dd className="font-mono">{o.tenantKey ?? "—"}</dd>
              <dt>Type</dt>
              <dd>{o.tenantType}</dd>
              <dt>Status</dt>
              <dd>{o.tenantStatus}</dd>
              <dt>Operating model</dt>
              <dd>{o.operatingModel}</dd>
              <dt>Jurisdiction</dt>
              <dd>{o.jurisdiction}</dd>
              <dt>Data region</dt>
              <dd>{o.dataRegion}</dd>
            </dl>
          </section>
        ))
      )}
    </div>
  );
}
