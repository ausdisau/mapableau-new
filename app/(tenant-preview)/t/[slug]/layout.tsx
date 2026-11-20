import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { GenericTenantShell } from "@/components/domain-services/GenericTenantShell";
import { getDraftBySlug } from "@/lib/tenancy/domain-services-registry";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export default async function TenantPreviewLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) notFound();

  if (tenant.source === "domain_services_draft") {
    const draft = getDraftBySlug(tenant.slug);
    if (!draft) notFound();
    return (
      <GenericTenantShell
        slug={draft.slug}
        brand={draft.brand}
        modules={draft.modules}
      >
        {children}
      </GenericTenantShell>
    );
  }

  // Static tenants (Coverage Care / Acme): minimal preview shell until Brand OS lands.
  return (
    <GenericTenantShell
      slug={tenant.slug}
      brand={{
        companyName: tenant.name,
        tagline: "Synthetic tenant preview",
        logoUrl: "",
        primaryColor: "#0F4C5C",
        supportEmail: "",
        supportPhone: "",
      }}
      modules={{
        landing: true,
        services: true,
        enquire: false,
        portal: false,
        contact: true,
        privacy: true,
        admin: true,
      }}
    >
      {children}
    </GenericTenantShell>
  );
}
