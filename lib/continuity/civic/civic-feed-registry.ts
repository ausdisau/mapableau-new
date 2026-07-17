/**
 * Wave 11 — Civic Feed Registry.
 *
 * External civic feeds (e.g. hospital, transport, weather, disaster
 * bureaus) are DISABLED by default. Registration alone is not enough;
 * production activation requires an approver AND `productionActivated=true`.
 * Even after activation, individual signals from a feed are only used when
 * they pass freshness + validation.
 */

import type { CivicFeedRegistration, CivicFeedRegistrationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface RegisterFeedInput {
  slug: string;
  displayName: string;
  provenanceUrl: string;
  freshnessTtlMinutes?: number;
  detailsJson?: Record<string, unknown>;
}

export async function proposeCivicFeed(input: RegisterFeedInput): Promise<CivicFeedRegistration> {
  return prisma.civicFeedRegistration.create({
    data: {
      slug: input.slug,
      displayName: input.displayName,
      provenanceUrl: input.provenanceUrl,
      freshnessTtlMinutes: input.freshnessTtlMinutes ?? 60,
      status: "proposed",
      productionActivated: false,
      detailsJson: asJson(input.detailsJson ?? undefined),
    },
  });
}

export async function approveCivicFeed(slug: string, approvedById: string) {
  const feed = await prisma.civicFeedRegistration.findUnique({ where: { slug } });
  if (!feed) throw new Error("CIVIC_FEED_NOT_FOUND");
  if (feed.status !== "proposed") throw new Error(`CIVIC_FEED_INVALID_STATE_${feed.status}`);
  return prisma.civicFeedRegistration.update({
    where: { slug },
    data: { status: "approved", approvedById, approvedAt: new Date() },
  });
}

export async function activateCivicFeed(slug: string) {
  const feed = await prisma.civicFeedRegistration.findUnique({ where: { slug } });
  if (!feed) throw new Error("CIVIC_FEED_NOT_FOUND");
  if (feed.status !== "approved") throw new Error("CIVIC_FEED_MUST_BE_APPROVED_FIRST");
  return prisma.civicFeedRegistration.update({
    where: { slug },
    data: { productionActivated: true },
  });
}

export function isFeedUsable(feed: CivicFeedRegistration | null | undefined): {
  usable: boolean;
  reason?: string;
} {
  if (!feed) return { usable: false, reason: "not_registered" };
  if (feed.status !== "approved" && feed.status !== "proposed") {
    return { usable: false, reason: `status_${feed.status}` };
  }
  if (!feed.productionActivated) return { usable: false, reason: "not_activated" };
  if (feed.status !== "approved") return { usable: false, reason: `status_${feed.status}` };
  return { usable: true };
}
