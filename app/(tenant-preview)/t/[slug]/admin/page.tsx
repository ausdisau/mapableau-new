import { notFound } from "next/navigation";

import { DomainReadinessCard } from "@/components/domain-services/DomainReadinessCard";
import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft = getDraftBySlug(tenant.slug);
  if (draft && !draft.modules.admin) notFound();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin / domain readiness</h1>
        <p className="mt-2 text-muted-foreground">
          Provisioning controls for {tenant.name}. No DNS writes or Vercel
          domain attach from this panel.
        </p>
      </div>
      <DomainReadinessCard slug={tenant.slug} companyName={tenant.name} />
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Tenant id</dt>
          <dd className="font-mono">{tenant.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Organisation id</dt>
          <dd className="font-mono">{tenant.organisationId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{tenant.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Domain activation</dt>
          <dd>{draft?.domainActivation ?? "NOT_CONFIGURED"}</dd>
        </div>
      </dl>
    </section>
  );
}
