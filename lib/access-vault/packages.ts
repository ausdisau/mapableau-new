import { createHash } from "node:crypto";

import type { ParticipantDataPackage } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import { getOrDraftVault } from "./vault";

/**
 * Access-vault packages are participant-visible, high-level catalogue entries
 * (e.g. "My accessibility preferences", "My service history summary"). Each
 * package rolls up structured data from a source system for the participant
 * to see and reason about. The package itself only stores metadata + a hash
 * — never PHI or free-text health data.
 */

export interface UpsertPackageInput {
  participantId: string;
  key: string;
  displayName: string;
  category: string;
  classification?: string;
  contentSummary?: Record<string, unknown>;
  sourceSystem?: string;
  lastRefreshedAt?: Date;
}

export async function upsertParticipantDataPackage(
  input: UpsertPackageInput
): Promise<ParticipantDataPackage> {
  const vault = await getOrDraftVault(input.participantId);
  const contentHash = input.contentSummary
    ? createHash("sha256")
        .update(JSON.stringify(input.contentSummary))
        .digest("hex")
    : null;
  return prisma.participantDataPackage.upsert({
    where: {
      participantId_key: {
        participantId: input.participantId,
        key: input.key,
      },
    },
    create: {
      participantId: input.participantId,
      vaultId: vault.id,
      key: input.key,
      displayName: input.displayName,
      category: input.category,
      classification: input.classification ?? "participant_confidential",
      contentSummary: asJson(input.contentSummary),
      contentHash: contentHash ?? undefined,
      sourceSystem: input.sourceSystem ?? undefined,
      lastRefreshedAt: input.lastRefreshedAt ?? new Date(),
    },
    update: {
      displayName: input.displayName,
      category: input.category,
      classification: input.classification ?? "participant_confidential",
      contentSummary: asJson(input.contentSummary),
      contentHash: contentHash ?? undefined,
      sourceSystem: input.sourceSystem ?? undefined,
      lastRefreshedAt: input.lastRefreshedAt ?? new Date(),
      vaultId: vault.id,
    },
  });
}

export async function listPackagesForParticipant(participantId: string) {
  return prisma.participantDataPackage.findMany({
    where: { participantId },
    orderBy: [{ category: "asc" }, { displayName: "asc" }],
  });
}

/**
 * Classify a package as portable, restricted, or non-portable. Portable
 * packages are eligible for inclusion in a `PortabilityExportJob`. Non-
 * portable packages must never leave the platform (e.g. safeguarding notes
 * that are governed by regulator-specific handling).
 */
export function classifyPortability(
  pkg: Pick<ParticipantDataPackage, "category" | "classification">
): "portable" | "portable_with_receipt" | "restricted" | "non_portable" {
  if (pkg.classification === "regulator_managed") return "non_portable";
  if (pkg.classification === "safeguarding_restricted") return "non_portable";
  if (pkg.category === "billing_history") return "restricted";
  if (pkg.category === "identity_verification") return "portable_with_receipt";
  return "portable";
}
