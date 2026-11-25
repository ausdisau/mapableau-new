import { notFound } from "next/navigation";

import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantPortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft = getDraftBySlug(tenant.slug);
  if (draft && !draft.modules.portal) notFound();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Participant portal</h1>
      <p className="text-muted-foreground">
        Portal entry point for {tenant.name} is a draft link only. Participant
        data stays on MapAble session paths — Host never authorises tenancy.
      </p>
    </section>
  );
}
