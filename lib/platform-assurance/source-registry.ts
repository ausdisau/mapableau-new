import type {
  PlatformScopeResult,
  RegulatoryAuthorityClass,
  RegulatorySourceVersion,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { REGISTRATION_CONTROL_SEEDS } from "./control-catalogue";
import {
  NON_ENACTED_AUTHORITY_CLASSES,
  REGULATORY_SOURCE_SEEDS,
} from "./source-catalogue";

export async function ensureRegulatorySourcesSeeded(): Promise<number> {
  let created = 0;
  for (const seed of REGULATORY_SOURCE_SEEDS) {
    const existing = await prisma.regulatorySourceVersion.findUnique({
      where: {
        sourceKey_retrievedAt: {
          sourceKey: seed.sourceKey,
          retrievedAt: new Date(seed.retrievedAt),
        },
      },
    });
    if (existing) continue;

    await prisma.regulatorySourceVersion.create({
      data: {
        sourceKey: seed.sourceKey,
        title: seed.title,
        publisher: seed.publisher,
        sourceUri: seed.sourceUri,
        versionLabel: seed.versionLabel,
        publicationDate: seed.publicationDate
          ? new Date(seed.publicationDate)
          : null,
        retrievedAt: new Date(seed.retrievedAt),
        authorityClass: seed.authorityClass,
        summary: seed.summary,
        contentHash: seed.contentHash,
        isImmutable: true,
        metadata: {
          seeded: true,
          researchCutoff: "2026-07-16",
        },
      },
    });
    created += 1;
  }
  return created;
}

export async function ensureRegistrationControlsSeeded(): Promise<number> {
  let created = 0;
  for (const seed of REGISTRATION_CONTROL_SEEDS) {
    const existing = await prisma.registrationControl.findUnique({
      where: { code: seed.code },
    });
    if (existing) continue;

    await prisma.registrationControl.create({
      data: {
        code: seed.code,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        complianceControlCode: seed.complianceControlCode,
        requirementSourceKey: seed.requirementSourceKey,
        ownerRole: seed.ownerRole,
        status: "not_started",
      },
    });
    created += 1;
  }
  return created;
}

export async function listRegulatorySources(options?: {
  includeSuperseded?: boolean;
}): Promise<RegulatorySourceVersion[]> {
  await ensureRegulatorySourcesSeeded();
  const rows = await prisma.regulatorySourceVersion.findMany({
    orderBy: [{ sourceKey: "asc" }, { retrievedAt: "desc" }],
  });
  if (options?.includeSuperseded) return rows;
  return rows.filter((r) => !r.supersededById);
}

/**
 * Immutable sources cannot change authorityClass or core identity fields.
 * Callers must create a new version and set supersededById instead.
 */
export function assertSourceMutable(
  source: Pick<RegulatorySourceVersion, "isImmutable">
): void {
  if (source.isImmutable) {
    throw new Error("REGULATORY_SOURCE_IMMUTABLE");
  }
}

export function assertDraftNotTreatedAsLaw(
  authorityClass: RegulatoryAuthorityClass
): void {
  if (NON_ENACTED_AUTHORITY_CLASSES.includes(authorityClass)) {
    // Soft guard used by callers that would otherwise promote to enacted legal state.
    throw new Error("DRAFT_OR_GUIDANCE_CANNOT_SET_ENACTED_LEGAL_STATE");
  }
}

/** True when the source must never silently drive "enacted" production legal rules. */
export function sourceRequiresHumanPromotion(
  authorityClass: RegulatoryAuthorityClass
): boolean {
  return NON_ENACTED_AUTHORITY_CLASSES.includes(authorityClass);
}

export function formatAuthorityClassLabel(
  authorityClass: RegulatoryAuthorityClass
): string {
  switch (authorityClass) {
    case "enacted_requirement":
      return "Enacted requirement";
    case "published_standard":
      return "Published standard";
    case "draft":
      return "Draft";
    case "candidate_recommendation":
      return "Candidate recommendation";
    case "consultation_proposal":
      return "Consultation proposal";
    case "implementation_guidance":
      return "Implementation guidance";
    case "organisational_policy":
      return "Organisational policy";
    case "mapable_design_choice":
      return "MapAble design choice";
    default: {
      const _exhaustive: never = authorityClass;
      return _exhaustive;
    }
  }
}

export function formatScopeResultLabel(result: PlatformScopeResult): string {
  switch (result) {
    case "likely_in_scope":
      return "Likely in scope (review opinion)";
    case "likely_out_of_scope":
      return "Likely out of scope (review opinion)";
    case "mixed_function_review_required":
      return "Mixed-function review required";
    case "insufficient_evidence":
      return "Insufficient evidence";
    case "legal_review_required":
      return "Legal review required";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}
