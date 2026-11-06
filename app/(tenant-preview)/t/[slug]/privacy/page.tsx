import { notFound } from "next/navigation";

import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantPrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft = getDraftBySlug(tenant.slug);
  if (draft && !draft.modules.privacy) notFound();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Privacy</h1>
      <p className="text-muted-foreground">
        Draft privacy notice placeholder for {tenant.name}. Providers must
        publish their own policy before any live activation.
      </p>
    </section>
  );
}
