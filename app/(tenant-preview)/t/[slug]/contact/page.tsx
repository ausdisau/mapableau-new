import { notFound } from "next/navigation";

import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft = getDraftBySlug(tenant.slug);
  if (draft && !draft.modules.contact) notFound();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="text-muted-foreground">
        {draft?.brand.supportEmail || draft?.brand.supportPhone
          ? `Reach ${tenant.name} at ${[
              draft.brand.supportEmail,
              draft.brand.supportPhone,
            ]
              .filter(Boolean)
              .join(" · ")}.`
          : `Contact details for ${tenant.name} have not been added to this draft yet.`}
      </p>
    </section>
  );
}
