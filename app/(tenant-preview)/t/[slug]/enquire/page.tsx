import { notFound } from "next/navigation";

import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantEnquirePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft = getDraftBySlug(tenant.slug);
  if (draft && !draft.modules.enquire) notFound();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Enquire</h1>
      <p className="text-muted-foreground">
        Enquiry capture is preview-only for {tenant.name}. No messages are sent
        in this draft shell.
      </p>
    </section>
  );
}
