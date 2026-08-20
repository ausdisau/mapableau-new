import type { AdEntityStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/permissions";
import {
  assertOrganisationAccess,
  getUserOrganisationIds,
  OrganisationAccessError,
} from "@/lib/api/organisation-scope";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api/response";

/** Permission required for org advertiser manager actions. */
export const ADS_MANAGER_ORG_PERMISSION = "care:manage:org" as const;

/** Statuses advertisers may never assign (admin/ops only). */
export const ADVERTISER_FORBIDDEN_STATUSES: readonly AdEntityStatus[] = [
  "APPROVED",
  "ACTIVE",
] as const;

/** Statuses an advertiser may edit drafts under. */
export const ADVERTISER_EDITABLE_STATUSES: readonly AdEntityStatus[] = [
  "DRAFT",
  "REJECTED",
  "PAUSED",
] as const;

export class AdsManagerDisabledError extends Error {
  constructor() {
    super("Ad Manager is disabled");
    this.name = "AdsManagerDisabledError";
  }
}

export class AdsManagerForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AdsManagerForbiddenError";
  }
}

export function assertAdsManagerEnabled(): void {
  if (!adsFlagsConfig.isManagerEnabled()) {
    throw new AdsManagerDisabledError();
  }
}

export function isMapAbleAdsAdmin(user: CurrentUser): boolean {
  return isAdminRole(user.primaryRole);
}

export async function getAdvertiserOrgIds(user: CurrentUser): Promise<string[]> {
  if (isMapAbleAdsAdmin(user)) {
    return getUserOrganisationIds(user.id);
  }
  if (!hasPermission(user.primaryRole, ADS_MANAGER_ORG_PERMISSION)) {
    return [];
  }
  return getUserOrganisationIds(user.id);
}

export async function assertCanManageOrganisationAds(
  user: CurrentUser,
  organisationId: string,
): Promise<void> {
  assertAdsManagerEnabled();
  if (isMapAbleAdsAdmin(user)) return;
  await assertOrganisationAccess(
    user,
    organisationId,
    ADS_MANAGER_ORG_PERMISSION,
  );
}

/**
 * Ensure the advertiser belongs to one of the caller's orgs (or admin).
 */
export async function assertCanAccessAdvertiser(
  user: CurrentUser,
  advertiserId: string,
): Promise<{ id: string; organisationId: string | null }> {
  assertAdsManagerEnabled();
  const advertiser = await prisma.adAdvertiser.findUnique({
    where: { id: advertiserId },
    select: { id: true, organisationId: true },
  });
  if (!advertiser) {
    throw new AdsManagerForbiddenError("Advertiser not found");
  }
  if (isMapAbleAdsAdmin(user)) return advertiser;
  if (!advertiser.organisationId) {
    throw new AdsManagerForbiddenError("Advertiser not linked to an organisation");
  }
  await assertCanManageOrganisationAds(user, advertiser.organisationId);
  return advertiser;
}

export function assertAdvertiserCannotSetStatus(
  status: AdEntityStatus | undefined,
): void {
  if (!status) return;
  if ((ADVERTISER_FORBIDDEN_STATUSES as readonly string[]).includes(status)) {
    throw new AdsManagerForbiddenError(
      "Advertisers cannot set APPROVED or ACTIVE status",
    );
  }
}

export function assertEditableByAdvertiser(status: AdEntityStatus): void {
  if (!(ADVERTISER_EDITABLE_STATUSES as readonly string[]).includes(status)) {
    throw new AdsManagerForbiddenError(
      `Cannot edit while status is ${status}`,
    );
  }
}

/** Map auth errors to HTTP responses for route handlers. */
export function adsManagerErrorResponse(err: unknown): Response {
  if (err instanceof AdsManagerDisabledError) {
    return jsonError("Ad Manager is disabled", 404);
  }
  if (err instanceof OrganisationAccessError || err instanceof AdsManagerForbiddenError) {
    return jsonError(err.message || "Forbidden", 403);
  }
  throw err;
}
