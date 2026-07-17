import type {
  DecisionImpact,
  Prisma,
  PublicationVisibility,
} from "@prisma/client";

import { assertApprovedAiaForPublish } from "@/lib/public-interest-governance/aia/aia-lifecycle";
import {
  redactPublicRegisterPayload,
  redactTextForPublication,
} from "@/lib/public-interest-governance/publication/redaction";
import { prisma } from "@/lib/prisma";

const BLOCKED_CERTIFICATION_CLAIMS = [
  "certified fair",
  "certified ethical",
  "regulatory approved",
  "regulatory approval",
  "guaranteed unbiased",
  "bias free",
  "risk free",
  "fully compliant",
  "officially safe",
];

export type CreateRegisterEntryInput = {
  systemId: string;
  systemVersionId?: string;
  legacyRegisteredAlgorithmId?: string;
  publicTitle: string;
  publicSummary: string;
  doesNotDoSummary: string;
  aiInvolved: boolean;
  ranksOrRecommends: boolean;
  ownerDisplay: string;
  affectedPeoplePublic: string;
  dataCategoriesPublic: Prisma.InputJsonValue;
  exclusionsPublic: string;
  humanReviewPublic: string;
  limitationsPublic: string;
  operatingStatus: string;
  challengeHowTo: string;
  visibility?: PublicationVisibility;
};

export function assertNoCertificationClaim(text: string): void {
  const lower = text.toLowerCase();
  const blocked = BLOCKED_CERTIFICATION_CLAIMS.find((phrase) =>
    lower.includes(phrase),
  );
  if (blocked) {
    throw new Error(`CERTIFICATION_CLAIM_FORBIDDEN:${blocked}`);
  }
}

function assertEntryCopy(input: CreateRegisterEntryInput): void {
  [
    input.publicTitle,
    input.publicSummary,
    input.doesNotDoSummary,
    input.exclusionsPublic,
    input.humanReviewPublic,
    input.limitationsPublic,
    input.challengeHowTo,
  ].forEach(assertNoCertificationClaim);
}

export async function createRegisterEntry(input: CreateRegisterEntryInput) {
  assertEntryCopy(input);

  return prisma.algorithmRegisterEntry.create({
    data: {
      ...input,
      visibility: input.visibility ?? "public",
      certificationClaimForbidden: true,
    },
  });
}

export async function publishRegisterEntry(params: {
  entryId: string;
  impact: DecisionImpact;
  publishedAt?: Date;
}) {
  const entry = await prisma.algorithmRegisterEntry.findUnique({
    where: { id: params.entryId },
  });
  if (!entry) throw new Error("REGISTER_ENTRY_NOT_FOUND");

  [
    entry.publicTitle,
    entry.publicSummary,
    entry.doesNotDoSummary,
    entry.exclusionsPublic,
    entry.humanReviewPublic,
    entry.limitationsPublic,
    entry.challengeHowTo,
  ].forEach(assertNoCertificationClaim);

  await assertApprovedAiaForPublish({
    systemId: entry.systemId,
    systemVersionId: entry.systemVersionId ?? undefined,
    impact: params.impact,
  });

  return prisma.algorithmRegisterEntry.update({
    where: { id: params.entryId },
    data: {
      publishedAt: params.publishedAt ?? new Date(),
      latestAssessmentAt: new Date(),
    },
  });
}

export function buildPublicRegisterPayload(
  entry: CreateRegisterEntryInput,
): unknown {
  return redactPublicRegisterPayload({
    ...entry,
    publicSummary: redactTextForPublication(entry.publicSummary),
    limitationsPublic: redactTextForPublication(entry.limitationsPublic),
  });
}
