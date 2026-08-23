/**
 * MapAble-side Alexa account link metadata.
 * Does not store OAuth tokens. Does not revoke Auth0/Amazon remotely.
 */

import { prisma } from "@/lib/prisma";

import { hashExternalSubject } from "./claims";
import type { AlexaLinkStatusResponse } from "./types";

export const ALEXA_LINK_PROVIDER = "AMAZON_ALEXA" as const;

export async function getAlexaLinkStatusForUser(
  userId: string,
): Promise<AlexaLinkStatusResponse> {
  const link = await prisma.externalAccountLink.findFirst({
    where: { userId, provider: ALEXA_LINK_PROVIDER },
    orderBy: { linkedAt: "desc" },
  });

  if (!link || link.status === "REVOKED" || link.revokedAt) {
    return {
      provider: ALEXA_LINK_PROVIDER,
      linked: false,
      status: link?.status === "REVOKED" ? "REVOKED" : "NOT_LINKED",
      revokedAt: link?.revokedAt?.toISOString(),
      grantsHomeAuthority: false,
      claimState: "IMPLEMENTED_NOT_VERIFIED",
      realDeviceControl: "NOT_IMPLEMENTED",
    };
  }

  return {
    provider: ALEXA_LINK_PROVIDER,
    linked: true,
    status: "LINKED",
    linkedAt: link.linkedAt.toISOString(),
    lastVerifiedAt: link.lastVerifiedAt?.toISOString(),
    grantsHomeAuthority: false,
    claimState: "IMPLEMENTED_NOT_VERIFIED",
    realDeviceControl: "NOT_IMPLEMENTED",
  };
}

export async function resolveMapAbleUserIdFromAlexaSubjectHash(
  externalSubjectHash: string,
): Promise<string | null> {
  const link = await prisma.externalAccountLink.findUnique({
    where: {
      provider_externalSubjectHash: {
        provider: ALEXA_LINK_PROVIDER,
        externalSubjectHash,
      },
    },
  });
  if (!link || link.status !== "LINKED" || link.revokedAt) return null;
  return link.userId;
}

export async function upsertAlexaAccountLink(input: {
  userId: string;
  externalSubject: string;
}): Promise<{ id: string }> {
  const externalSubjectHash = hashExternalSubject(
    ALEXA_LINK_PROVIDER,
    input.externalSubject,
  );
  const link = await prisma.externalAccountLink.upsert({
    where: {
      provider_externalSubjectHash: {
        provider: ALEXA_LINK_PROVIDER,
        externalSubjectHash,
      },
    },
    create: {
      userId: input.userId,
      provider: ALEXA_LINK_PROVIDER,
      externalSubjectHash,
      status: "LINKED",
      linkedAt: new Date(),
      lastVerifiedAt: new Date(),
    },
    update: {
      userId: input.userId,
      status: "LINKED",
      revokedAt: null,
      lastVerifiedAt: new Date(),
    },
  });
  return { id: link.id };
}

/** MapAble-side unlink only. Does not revoke Auth0 or Amazon remotely. */
export async function revokeAlexaAccountLinkForUser(
  userId: string,
): Promise<{ revoked: boolean }> {
  const result = await prisma.externalAccountLink.updateMany({
    where: {
      userId,
      provider: ALEXA_LINK_PROVIDER,
      status: "LINKED",
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });
  return { revoked: result.count > 0 };
}
