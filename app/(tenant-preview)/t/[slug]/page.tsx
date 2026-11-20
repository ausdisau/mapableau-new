import { notFound } from "next/navigation";

import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantPreviewHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();
  const draft =
    tenant.source === "domain_services_draft"
      ? getDraftBySlug(tenant.slug)
      : null;

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
      <p className="max-w-2xl text-muted-foreground">
        {draft?.brand.tagline ??
          "Synthetic white-label preview. This path never activates live DNS."}
      </p>
      {draft?.brand.supportEmail || draft?.brand.supportPhone ? (
        <p className="text-sm text-muted-foreground">
          Support:{" "}
          {[draft.brand.supportEmail, draft.brand.supportPhone]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
      <p className="text-sm">
        Status: <strong>{tenant.status}</strong> · Source:{" "}
        <strong>{tenant.source}</strong>
      </p>
    </section>
  );
}
