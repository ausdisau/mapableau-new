import { prisma } from "@/lib/prisma";

export interface TenantStatusReport {
  organisationId: string;
  tenantStatus: string;
  restrictedAt: string | null;
  suspendedAt: string | null;
  offboardingStartedAt: string | null;
  updatedAt: string;
  disclaimer: string;
}

const DISCLAIMER =
  "Tenant status is operational metadata. It is not a certification, an entitlement, or a GA approval.";

export async function getTenantStatus(
  organisationId: string
): Promise<TenantStatusReport | null> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      id: true,
      tenantStatus: true,
      restrictedAt: true,
      suspendedAt: true,
      offboardingStartedAt: true,
      updatedAt: true,
    },
  });
  if (!org) return null;
  return {
    organisationId: org.id,
    tenantStatus: org.tenantStatus,
    restrictedAt: org.restrictedAt ? org.restrictedAt.toISOString() : null,
    suspendedAt: org.suspendedAt ? org.suspendedAt.toISOString() : null,
    offboardingStartedAt: org.offboardingStartedAt
      ? org.offboardingStartedAt.toISOString()
      : null,
    updatedAt: org.updatedAt.toISOString(),
    disclaimer: DISCLAIMER,
  };
}
