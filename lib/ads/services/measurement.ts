import { validateAdDestination } from "@/lib/ads/destination/validate-url";
import { shouldRecordFirstPartyImpression } from "@/lib/ads/measurement/impressions";
import { emitAdsEvent } from "@/lib/ads/observability/events";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { prisma } from "@/lib/prisma";
import type { AdProviderKind } from "@prisma/client";

export async function recordAdImpression(input: {
  decisionId: string;
  placementCode: string;
  provider: AdProviderKind;
  campaignId?: string;
  anonymousSessionRef?: string;
}): Promise<{ id: string; deduped: boolean } | null> {
  if (!adsFlagsConfig.isMeasurementEnabled()) {
    return null;
  }

  const dedupeKey = `${input.decisionId}:${input.placementCode}`;
  if (!shouldRecordFirstPartyImpression(dedupeKey)) {
    return { id: "deduped", deduped: true };
  }

  // Prefer existing decision row; create a lightweight decision if missing
  let decision = await prisma.adDecision.findUnique({
    where: { id: input.decisionId },
  });
  if (!decision) {
    decision = await prisma.adDecision.create({
      data: {
        id: input.decisionId,
        requestId: input.decisionId,
        placementCode: input.placementCode,
        provider: input.provider,
        campaignId: input.campaignId,
        decision:
          input.provider === "mapable_internal"
            ? "FILL_INTERNAL"
            : "FILL_EXTERNAL",
      },
    });
  }

  const impression = await prisma.adImpression.create({
    data: {
      decisionId: decision.id,
      campaignId: input.campaignId,
      placementCode: input.placementCode,
      provider: input.provider,
      anonymousSessionRef: input.anonymousSessionRef,
    },
  });

  emitAdsEvent({
    event: "ads.impression",
    decisionId: decision.id,
    placementCode: input.placementCode,
    provider: input.provider,
    campaignId: input.campaignId,
  });

  return { id: impression.id, deduped: false };
}

export async function recordAdClickAndResolveDestination(input: {
  impressionId: string;
}): Promise<
  | { ok: true; redirectUrl: string; clickId: string }
  | { ok: false; reason: string }
> {
  const impression = await prisma.adImpression.findUnique({
    where: { id: input.impressionId },
    include: {
      campaign: {
        include: {
          creatives: {
            where: { status: { in: ["APPROVED", "ACTIVE"] } },
            take: 1,
          },
        },
      },
    },
  });

  if (!impression) {
    return { ok: false, reason: "impression_not_found" };
  }

  const creative = impression.campaign?.creatives[0];
  if (!creative?.destinationUrl) {
    return { ok: false, reason: "destination_missing" };
  }

  const validated = validateAdDestination(creative.destinationUrl, {
    requireHttps: process.env.NODE_ENV === "production",
  });
  if (!validated.ok) {
    return { ok: false, reason: validated.reason };
  }

  const click = await prisma.adClick.create({
    data: {
      impressionId: impression.id,
      campaignId: impression.campaignId,
      provider: impression.provider,
    },
  });

  emitAdsEvent({
    event: "ads.click",
    decisionId: impression.decisionId,
    campaignId: impression.campaignId ?? undefined,
    provider: impression.provider,
  });

  return { ok: true, redirectUrl: validated.href, clickId: click.id };
}

/**
 * Resolve click by decision id when impression row uses decisionId as redirect token.
 * Foundation redirect path: /r/ads/:impressionOrDecisionId
 */
export async function resolveClickRedirect(
  token: string,
): Promise<
  | { ok: true; redirectUrl: string }
  | { ok: false; reason: string }
> {
  // Try as impression id first
  const asImpression = await prisma.adImpression.findUnique({
    where: { id: token },
    include: {
      campaign: {
        include: {
          creatives: {
            where: { status: { in: ["APPROVED", "ACTIVE"] } },
            take: 1,
          },
        },
      },
    },
  });

  if (asImpression) {
    const result = await recordAdClickAndResolveDestination({
      impressionId: asImpression.id,
    });
    if (!result.ok) return result;
    return { ok: true, redirectUrl: result.redirectUrl };
  }

  // Decision token: find linked creative via campaign on decision
  const decision = await prisma.adDecision.findUnique({
    where: { id: token },
    include: {
      campaign: {
        include: {
          creatives: {
            where: { status: { in: ["APPROVED", "ACTIVE"] } },
            take: 1,
          },
        },
      },
    },
  });

  if (!decision?.campaign?.creatives[0]) {
    // Fall back to synthetic destinations for foundation demo without DB rows
    return resolveSyntheticDestination(token);
  }

  const creative = decision.campaign.creatives[0];
  const validated = validateAdDestination(creative.destinationUrl, {
    requireHttps: process.env.NODE_ENV === "production",
  });
  if (!validated.ok) {
    return { ok: false, reason: validated.reason };
  }

  if (adsFlagsConfig.isMeasurementEnabled()) {
    try {
      const impression = await prisma.adImpression.create({
        data: {
          decisionId: decision.id,
          campaignId: decision.campaignId,
          placementCode: decision.placementCode,
          provider: decision.provider ?? "mapable_internal",
        },
      });
      await prisma.adClick.create({
        data: {
          impressionId: impression.id,
          campaignId: decision.campaignId,
          provider: decision.provider ?? "mapable_internal",
        },
      });
    } catch {
      // best-effort
    }
  }

  emitAdsEvent({
    event: "ads.click",
    decisionId: decision.id,
    campaignId: decision.campaignId ?? undefined,
  });

  return { ok: true, redirectUrl: validated.href };
}

function resolveSyntheticDestination(
  token: string,
): { ok: true; redirectUrl: string } | { ok: false; reason: string } {
  // Allow foundation UI to deep-link approved MapAble destinations without DB
  if (token.includes("house") || token.includes("academy")) {
    return { ok: true, redirectUrl: "https://mapable.com.au/academy" };
  }
  if (token.includes("cafe") || token.includes("direct")) {
    return { ok: true, redirectUrl: "https://mapable.com.au/access" };
  }
  // Default approved MapAble destination for synthetic decision ids
  if (token.startsWith("dec_")) {
    return { ok: true, redirectUrl: "https://mapable.com.au/access" };
  }
  return { ok: false, reason: "not_found" };
}
