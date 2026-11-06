import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { TenantDisabled } from "@/components/tenants/TenantDisabled";
import { TenantShell } from "@/components/tenants/TenantShell";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import { COVERAGE_CARE_BRAND } from "@/lib/tenancy/coverage-care-brand";
import { resolveTenantBySlug } from "@/lib/tenancy/tenant-registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = resolveTenantBySlug(slug);
  if (!tenant) {
    return { title: "Tenant not found", robots: { index: false, follow: false } };
  }

  return {
    title: {
      default: tenant.name,
      template: `%s | ${tenant.name}`,
    },
    description: COVERAGE_CARE_BRAND.tagline,
    robots: { index: false, follow: false },
    metadataBase: coverageCareConfig.enabled
      ? new URL(`https://${coverageCareConfig.host}`)
      : undefined,
  };
}

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

  if (!coverageCareConfig.enabled) {
    return <TenantDisabled slug={slug} />;
  }

  if (tenant.slug !== COVERAGE_CARE_BRAND.slug) {
    // Acme isolation tenant has no public branded shell in this pilot.
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Isolation fixture only</h1>
        <p className="mt-2 text-sm">
          Tenant <code>{tenant.slug}</code> is registered for cross-tenant tests
          and has no public preview shell.
        </p>
        {children}
      </div>
    );
  }

  return <TenantShell slug={slug}>{children}</TenantShell>;
}
