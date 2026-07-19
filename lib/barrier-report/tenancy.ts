import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { isProviderBarrierInboxEnabled } from "@/lib/config/access-independence";
import { prisma } from "@/lib/prisma";

/** Safe fields for provider inbox — never contact or triage notes. */
export const PROVIDER_BARRIER_SELECT = {
  id: true,
  referenceNumber: true,
  category: true,
  description: true,
  placeName: true,
  placeSlug: true,
  locationDetail: true,
  urgency: true,
  status: true,
  observedAt: true,
  imageDescription: true,
  anonymous: true,
  organisationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function resolveProviderOrgIds(user: CurrentUser): Promise<string[]> {
  return getUserOrganisationIds(user.id);
}

/**
 * List reports visible to a provider user.
 * Fail-closed: only organisation-bound reports in the caller's memberships.
 * Platform admins may list unassigned + all when using admin route separately.
 */
export async function listProviderScopedBarrierReports(user: CurrentUser) {
  if (!isProviderBarrierInboxEnabled()) {
    return [];
  }
  const orgIds = await resolveProviderOrgIds(user);
  if (orgIds.length === 0) return [];

  return prisma.accessBarrierReport.findMany({
    where: {
      isDraft: false,
      status: { not: "draft" },
      organisationId: { in: orgIds },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: PROVIDER_BARRIER_SELECT,
  });
}

/**
 * Load a report for provider update. Returns null (→ 404) if outside tenant.
 */
export async function getProviderScopedBarrierReport(
  user: CurrentUser,
  reportId: string,
) {
  if (!isProviderBarrierInboxEnabled()) return null;
  const orgIds = await resolveProviderOrgIds(user);
  if (orgIds.length === 0) return null;

  return prisma.accessBarrierReport.findFirst({
    where: {
      id: reportId,
      isDraft: false,
      status: { not: "draft" },
      organisationId: { in: orgIds },
    },
  });
}

export function isPlatformBarrierModerator(user: CurrentUser): boolean {
  return isAdminRole(user.primaryRole);
}
