import { createHash } from "node:crypto";

import type { AdBuyingChannel, AdBuyingMode, AdQuoteKind } from "@prisma/client";

import { createDoohSandboxAdapter } from "@/lib/ads/connectors/dooh-sandbox";
import { createMapAbleOwnedConnector } from "@/lib/ads/connectors/mapable-owned";
import { assertAmountMinor } from "@/lib/ads/money/minor";
import { prisma } from "@/lib/prisma";

export type CreateQuoteInput = {
  advertiserId: string;
  organisationId?: string | null;
  campaignId?: string | null;
  opportunityId: string;
  channel: AdBuyingChannel;
  providerId: string;
  mediaMinor: number;
  partnerFeesMinor?: number;
  platformFeesMinor?: number;
  taxMinor?: number;
  buyingMode: AdBuyingMode;
  quoteKind?: AdQuoteKind;
};

export async function createPlacementQuote(input: CreateQuoteInput) {
  const mediaMinor = assertAmountMinor(input.mediaMinor, "mediaMinor");
  const partnerFeesMinor = assertAmountMinor(
    input.partnerFeesMinor ?? 0,
    "partnerFeesMinor",
  );
  const platformFeesMinor = assertAmountMinor(
    input.platformFeesMinor ?? Math.round(mediaMinor * 0.05),
    "platformFeesMinor",
  );
  const taxMinor = assertAmountMinor(
    input.taxMinor ?? Math.round((mediaMinor + partnerFeesMinor + platformFeesMinor) * 0.1),
    "taxMinor",
  );
  const totalMinor =
    mediaMinor + partnerFeesMinor + platformFeesMinor + taxMinor;

  let expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  let termsHash = createHash("sha256")
    .update(
      JSON.stringify({
        opportunityId: input.opportunityId,
        totalMinor,
        channel: input.channel,
      }),
    )
    .digest("hex");

  if (input.channel === "dooh") {
    const adapter = createDoohSandboxAdapter();
    const quoted = await adapter.requestQuote({
      opportunityId: input.opportunityId,
      mediaMinor,
    });
    expiresAt = new Date(quoted.expiresAt);
    termsHash = quoted.termsHash;
  } else if (input.channel === "mapable") {
    const estimate = await createMapAbleOwnedConnector().estimate({
      opportunityId: input.opportunityId,
    });
    if (estimate.expiresAt) expiresAt = new Date(estimate.expiresAt);
  }

  return prisma.adPlacementQuote.create({
    data: {
      advertiserId: input.advertiserId,
      organisationId: input.organisationId ?? null,
      campaignId: input.campaignId ?? null,
      opportunityId: input.opportunityId,
      providerId: input.providerId,
      channel: input.channel,
      quoteKind: input.quoteKind ?? "indicative",
      currency: "AUD",
      mediaMinor: BigInt(mediaMinor),
      partnerFeesMinor: BigInt(partnerFeesMinor),
      platformFeesMinor: BigInt(platformFeesMinor),
      taxMinor: BigInt(taxMinor),
      totalMinor: BigInt(totalMinor),
      termsHash,
      expiresAt,
      isInventoryReserved: false,
      buyingMode: input.buyingMode,
      capabilityStatus: "demo",
      provenanceJson: {
        sourceType: "synthetic_fixture",
        sourceId: input.opportunityId,
      },
    },
  });
}

export function serializeQuote(quote: {
  id: string;
  opportunityId: string | null;
  providerId: string;
  channel: AdBuyingChannel;
  quoteKind: AdQuoteKind;
  currency: string;
  mediaMinor: bigint;
  partnerFeesMinor: bigint;
  platformFeesMinor: bigint;
  taxMinor: bigint;
  totalMinor: bigint;
  termsHash: string;
  expiresAt: Date;
  isInventoryReserved: boolean;
  buyingMode: AdBuyingMode;
  capabilityStatus: string;
  provenanceJson: unknown;
}) {
  return {
    id: quote.id,
    opportunityId: quote.opportunityId,
    providerId: quote.providerId,
    channel: quote.channel,
    quoteKind: quote.quoteKind,
    availability: quote.quoteKind,
    buyingMode: quote.buyingMode,
    price: {
      currency: quote.currency,
      mediaMinor: Number(quote.mediaMinor),
      partnerFeesMinor: Number(quote.partnerFeesMinor),
      mapAbleFeesMinor: Number(quote.platformFeesMinor),
      taxMinor: Number(quote.taxMinor),
      totalMinor: Number(quote.totalMinor),
      amountMinor: Number(quote.totalMinor),
    },
    termsHash: quote.termsHash,
    expiresAt: quote.expiresAt.toISOString(),
    isInventoryReserved: quote.isInventoryReserved,
    capabilityStatus: quote.capabilityStatus,
    provenance: quote.provenanceJson,
  };
}
