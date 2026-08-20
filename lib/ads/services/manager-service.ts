import type { AdEntityStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  assertAdvertiserCannotSetStatus,
  assertCanAccessAdvertiser,
  assertCanManageOrganisationAds,
  assertEditableByAdvertiser,
  getAdvertiserOrgIds,
  isMapAbleAdsAdmin,
} from "@/lib/ads/auth/advertiser-access";
import { validateAdDestination } from "@/lib/ads/destination/validate-url";
import { flagCreativeClaims } from "@/lib/ads/moderation/creative-review";
import { prisma } from "@/lib/prisma";

export async function listOrgAdvertisers(user: CurrentUser) {
  if (isMapAbleAdsAdmin(user)) {
    return prisma.adAdvertiser.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { _count: { select: { campaigns: true } } },
    });
  }
  const orgIds = await getAdvertiserOrgIds(user);
  if (orgIds.length === 0) return [];
  return prisma.adAdvertiser.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { _count: { select: { campaigns: true } } },
  });
}

export async function createOrgAdvertiser(
  user: CurrentUser,
  input: { name: string; organisationId: string },
) {
  await assertCanManageOrganisationAds(user, input.organisationId);

  const advertiser = await prisma.adAdvertiser.create({
    data: {
      name: input.name.trim(),
      organisationId: input.organisationId,
      status: "DRAFT",
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "ads.advertiser.created",
    entityType: "AdAdvertiser",
    entityId: advertiser.id,
    organisationId: input.organisationId,
    metadata: { name: advertiser.name },
  });

  return advertiser;
}

export async function listOrgCampaigns(user: CurrentUser) {
  if (isMapAbleAdsAdmin(user)) {
    return prisma.adCampaign.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { advertiser: true, creatives: { take: 5 } },
    });
  }
  const orgIds = await getAdvertiserOrgIds(user);
  if (orgIds.length === 0) return [];
  return prisma.adCampaign.findMany({
    where: { advertiser: { organisationId: { in: orgIds } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { advertiser: true, creatives: { take: 5 } },
  });
}

export async function createOrgCampaign(
  user: CurrentUser,
  input: {
    advertiserId: string;
    name: string;
    placementCodes?: string[];
    isHouse?: boolean;
    region?: string;
    category?: string;
  },
) {
  await assertCanAccessAdvertiser(user, input.advertiserId);

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: input.advertiserId,
      name: input.name.trim(),
      status: "DRAFT",
      placementCodes: input.placementCodes ?? [],
      isHouse: input.isHouse ?? false,
      providerPreference: "mapable_internal",
      targets:
        input.region || input.category
          ? {
              create: {
                region: input.region,
                category: input.category,
                geometry: { type: "NATIONAL" },
              },
            }
          : undefined,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "ads.campaign.created",
    entityType: "AdCampaign",
    entityId: campaign.id,
    metadata: { advertiserId: input.advertiserId },
  });

  return campaign;
}

export async function patchOrgCampaign(
  user: CurrentUser,
  campaignId: string,
  input: {
    name?: string;
    placementCodes?: string[];
    status?: AdEntityStatus;
  },
) {
  assertAdvertiserCannotSetStatus(input.status);

  const existing = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { advertiser: true },
  });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  await assertCanAccessAdvertiser(user, existing.advertiserId);
  if (!isMapAbleAdsAdmin(user)) {
    assertEditableByAdvertiser(existing.status);
  }

  const campaign = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      name: input.name?.trim(),
      placementCodes: input.placementCodes,
      status: input.status,
    },
  });

  return campaign;
}

export async function listOrgCreatives(user: CurrentUser) {
  if (isMapAbleAdsAdmin(user)) {
    return prisma.adCreative.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { campaign: { include: { advertiser: true } } },
    });
  }
  const orgIds = await getAdvertiserOrgIds(user);
  if (orgIds.length === 0) return [];
  return prisma.adCreative.findMany({
    where: {
      campaign: { advertiser: { organisationId: { in: orgIds } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { campaign: { include: { advertiser: true } } },
  });
}

export async function createOrgCreative(
  user: CurrentUser,
  input: {
    campaignId: string;
    format: string;
    headline: string;
    body: string;
    destinationUrl: string;
    imageUrl?: string;
    altText?: string;
    businessName?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: input.campaignId },
  });
  if (!campaign) throw new Error("NOT_FOUND");
  await assertCanAccessAdvertiser(user, campaign.advertiserId);
  if (!isMapAbleAdsAdmin(user)) {
    assertEditableByAdvertiser(campaign.status);
  }

  const dest = validateAdDestination(input.destinationUrl, {
    requireHttps: false,
  });
  if (!dest.ok) {
    throw new Error(`INVALID_DESTINATION:${dest.reason}`);
  }

  const claimFlags = flagCreativeClaims(`${input.headline} ${input.body}`);

  const creative = await prisma.adCreative.create({
    data: {
      campaignId: input.campaignId,
      format: input.format,
      headline: input.headline.trim(),
      body: input.body.trim(),
      destinationUrl: dest.href,
      imageUrl: input.imageUrl,
      altText: input.altText,
      businessName: input.businessName,
      latitude: input.latitude,
      longitude: input.longitude,
      status: "DRAFT",
      claimFlags,
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "ads.creative.created",
    entityType: "AdCreative",
    entityId: creative.id,
    metadata: { campaignId: input.campaignId, claimFlags },
  });

  return creative;
}

export async function submitCreativeForReview(
  user: CurrentUser,
  creativeId: string,
) {
  const creative = await prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: { campaign: true },
  });
  if (!creative) throw new Error("NOT_FOUND");
  await assertCanAccessAdvertiser(user, creative.campaign.advertiserId);

  if (creative.status !== "DRAFT" && creative.status !== "REJECTED") {
    throw new Error("INVALID_STATUS");
  }

  const claimFlags =
    creative.claimFlags.length > 0
      ? creative.claimFlags
      : flagCreativeClaims(`${creative.headline} ${creative.body}`);

  const [updated] = await prisma.$transaction([
    prisma.adCreative.update({
      where: { id: creativeId },
      data: { status: "PENDING_REVIEW", claimFlags },
    }),
    prisma.adCampaign.update({
      where: { id: creative.campaignId },
      data: {
        status:
          creative.campaign.status === "DRAFT" ||
          creative.campaign.status === "REJECTED"
            ? "PENDING_REVIEW"
            : creative.campaign.status,
      },
    }),
    prisma.adPolicyReview.create({
      data: {
        creativeId,
        status: "PENDING_REVIEW",
        claimFlags,
        notes: claimFlags.length
          ? "Auto-flagged claims require human review"
          : "Submitted for MapAble review",
        reviewerId: null,
      },
    }),
  ]);

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "ads.creative.submitted",
    entityType: "AdCreative",
    entityId: creativeId,
    metadata: { claimFlags },
  });

  return updated;
}
