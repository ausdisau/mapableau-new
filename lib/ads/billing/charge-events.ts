import { cpmChargePerImpression } from "@/lib/ads/money/micros";
import { chargeAdvertiserWallet } from "@/lib/ads/billing/wallet";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { prisma } from "@/lib/prisma";

/**
 * Bill CPM campaigns after a validated viewable impression.
 * Client never submits charge amounts — server loads auction clearing price.
 */
export async function billViewableImpression(input: {
  impressionId: string;
}): Promise<
  | { ok: true; chargedMicros: string; duplicate: boolean }
  | { ok: false; reason: string }
> {
  if (!adsFlagsConfig.isBillingEnabled()) {
    return { ok: false, reason: "billing_disabled" };
  }

  const impression = await prisma.adImpression.findUnique({
    where: { id: input.impressionId },
    include: {
      campaign: true,
    },
  });
  if (!impression?.campaignId || !impression.campaign) {
    return { ok: false, reason: "impression_not_found" };
  }

  const campaign = impression.campaign;
  if (campaign.isHouse || campaign.bidModel === "HOUSE") {
    return { ok: false, reason: "house_no_charge" };
  }
  if (campaign.bidModel !== "CPM") {
    return { ok: false, reason: "not_cpm" };
  }

  const auction = await prisma.adAuctionResult.findUnique({
    where: { decisionId: impression.decisionId },
  });
  if (!auction?.clearingEcpmMicros) {
    return { ok: false, reason: "auction_missing" };
  }

  const wallet = await prisma.adWallet.findUnique({
    where: {
      advertiserId_currency: {
        advertiserId: campaign.advertiserId,
        currency: "AUD",
      },
    },
  });
  if (!wallet) {
    return { ok: false, reason: "wallet_missing" };
  }

  const charged = cpmChargePerImpression(auction.clearingEcpmMicros);
  const result = await chargeAdvertiserWallet({
    walletId: wallet.id,
    campaignId: campaign.id,
    advertiserId: campaign.advertiserId,
    decisionId: impression.decisionId,
    impressionId: impression.id,
    bidModel: "CPM",
    clearingPriceMicros: auction.clearingEcpmMicros,
    chargedMicros: charged,
    idempotencyKey: `impression:${impression.id}`,
    ledgerType: "IMPRESSION_CHARGE",
  });

  if (!result.ok) {
    return { ok: false, reason: result.reason.toLowerCase() };
  }

  return {
    ok: true,
    chargedMicros: result.chargedMicros.toString(),
    duplicate: result.duplicate,
  };
}

/**
 * Bill CPC campaigns after a valid destination click (server-side only).
 * At most one billable click per impression.
 */
export async function billValidClick(input: {
  clickId: string;
  impressionId: string;
}): Promise<
  | { ok: true; chargedMicros: string; duplicate: boolean }
  | { ok: false; reason: string }
> {
  if (!adsFlagsConfig.isBillingEnabled()) {
    return { ok: false, reason: "billing_disabled" };
  }

  const click = await prisma.adClick.findUnique({
    where: { id: input.clickId },
    include: { campaign: true, impression: true },
  });
  if (!click?.campaign || !click.impression) {
    return { ok: false, reason: "click_not_found" };
  }

  const campaign = click.campaign;
  if (campaign.isHouse || campaign.bidModel === "HOUSE") {
    return { ok: false, reason: "house_no_charge" };
  }
  if (campaign.bidModel !== "CPC") {
    return { ok: false, reason: "not_cpc" };
  }

  // One billable click per impression
  const prior = await prisma.adBillingEvent.findFirst({
    where: {
      impressionId: input.impressionId,
      bidModel: "CPC",
      status: "CHARGED",
    },
  });
  if (prior && prior.clickId !== input.clickId) {
    return { ok: false, reason: "impression_already_clicked" };
  }

  const auction = await prisma.adAuctionResult.findUnique({
    where: { decisionId: click.impression.decisionId },
  });
  if (!auction?.clearingUnitPriceMicros) {
    return { ok: false, reason: "auction_missing" };
  }

  const wallet = await prisma.adWallet.findUnique({
    where: {
      advertiserId_currency: {
        advertiserId: campaign.advertiserId,
        currency: "AUD",
      },
    },
  });
  if (!wallet) {
    return { ok: false, reason: "wallet_missing" };
  }

  const charged = auction.clearingUnitPriceMicros;
  const result = await chargeAdvertiserWallet({
    walletId: wallet.id,
    campaignId: campaign.id,
    advertiserId: campaign.advertiserId,
    decisionId: click.impression.decisionId,
    impressionId: input.impressionId,
    clickId: input.clickId,
    bidModel: "CPC",
    clearingPriceMicros: charged,
    chargedMicros: charged,
    idempotencyKey: `click:${input.clickId}`,
    ledgerType: "CLICK_CHARGE",
  });

  if (!result.ok) {
    return { ok: false, reason: result.reason.toLowerCase() };
  }

  return {
    ok: true,
    chargedMicros: result.chargedMicros.toString(),
    duplicate: result.duplicate,
  };
}
