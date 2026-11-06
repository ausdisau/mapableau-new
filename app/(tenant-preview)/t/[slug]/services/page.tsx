import { notFound } from "next/navigation";

import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft = getDraftBySlug(tenant.slug);
  if (draft && !draft.modules.services) notFound();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Services directory</h1>
      <p className="text-muted-foreground">
        Placeholder catalogue for {tenant.name}. Listings are draft-only and not
        verified for matching or booking.
      </p>
    </section>
  );
}
