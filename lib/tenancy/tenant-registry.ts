import { COVERAGE_CARE_BRAND } from "@/lib/tenancy/coverage-care-brand";
import { isReservedTenantLabel } from "@/lib/tenancy/tenant-host-policy";

export type RegisteredTenant = {
  id: string;
  slug: string;
  name: string;
  organisationId: string;
  status: "preview" | "not_configured";
  synthetic: true;
};

const REGISTRY: RegisteredTenant[] = [
  {
    id: "tenant_coverage_care",
    slug: COVERAGE_CARE_BRAND.slug,
    name: COVERAGE_CARE_BRAND.name,
    organisationId: "org_coverage_care",
    status: "preview",
    synthetic: true,
  },
  {
    id: "tenant_acme_care",
    slug: "acme-care",
    name: "Acme Care (fictional isolation tenant)",
    organisationId: "org_acme_care",
    status: "preview",
    synthetic: true,
  },
];

/**
 * Server-side tenant resolve by approved slug only.
 * Never authorize from Host header, client x-tenant-id, or organisationId alone.
 */
export function resolveTenantBySlug(slug: string | null | undefined): RegisteredTenant | null {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  if (isReservedTenantLabel(normalized)) return null;
  // Accept legacy slug used in earlier pilot paths.
  const lookup =
    normalized === "coverage-care" ? COVERAGE_CARE_BRAND.slug : normalized;
  return REGISTRY.find((t) => t.slug === lookup) ?? null;
}

export function getCoverageCareRegisteredTenant(): RegisteredTenant {
  const tenant = resolveTenantBySlug(COVERAGE_CARE_BRAND.slug);
  if (!tenant) throw new Error("COVERAGE_CARE_TENANT_MISSING");
  return tenant;
}

export function getAcmeCareRegisteredTenant(): RegisteredTenant {
  const tenant = resolveTenantBySlug("acme-care");
  if (!tenant) throw new Error("ACME_CARE_TENANT_MISSING");
  return tenant;
}

export function listRegisteredTenants(): RegisteredTenant[] {
  return REGISTRY.map((t) => ({ ...t }));
}

/** Host / client header must never grant membership. */
export function denyClientTenantClaim(_claim: {
  host?: string | null;
  headerTenantId?: string | null;
  organisationId?: string | null;
}): never {
  throw new Error("CLIENT_TENANT_CLAIM_REJECTED");
}
