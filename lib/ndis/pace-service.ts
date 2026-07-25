import { z } from "zod";

import { decryptNdisNumber } from "@/lib/crypto/ndis";
import {
  defaultPaceBudgetOverlay,
  getPaceBudgetOverlay,
} from "@/lib/ndis/pace-endorsement-store";
import { prisma } from "@/lib/prisma";

export const PaceEndorsementStatusSchema = z.enum([
  "ACTIVE",
  "PENDING_APPROVAL",
  "NOT_ENDORSED",
  "EXPIRED",
]);

export type PaceEndorsementStatus = z.infer<typeof PaceEndorsementStatusSchema>;

export const ParticipantPaceProfileSchema = z.object({
  ndisNumber: z.string().nullable(),
  supportCategoryCode: z.string().min(1),
  endorsedProviderId: z.string().nullable(),
  expirationDate: z.string().datetime().or(z.string().min(1)),
  remainingCategoryBudget: z.number().nonnegative(),
  totalCategoryBudget: z.number().positive(),
});

export type ParticipantPaceProfile = z.infer<typeof ParticipantPaceProfileSchema>;

export type PaceEndorsementVerification = {
  authorized: boolean;
  status: PaceEndorsementStatus;
  profile: ParticipantPaceProfile;
  warnings: string[];
};

function mapRelationshipStatus(
  status: string | undefined
): PaceEndorsementStatus {
  if (status === "active") return "ACTIVE";
  if (status === "pending_verification") return "PENDING_APPROVAL";
  return "NOT_ENDORSED";
}

/**
 * Verify the provider is endorsed under the participant's PACE plan category.
 * Uses ParticipantProviderRelationship + scaffold budget overlay (no new DDL).
 */
export async function verifyPaceEndorsement(
  participantId: string,
  providerId: string,
  categoryCode: string
): Promise<PaceEndorsementVerification> {
  const [relationship, profile] = await Promise.all([
    prisma.participantProviderRelationship.findUnique({
      where: {
        participantId_providerOrgId: {
          participantId,
          providerOrgId: providerId,
        },
      },
    }),
    prisma.participantProfile.findUnique({
      where: { userId: participantId },
      select: { ndisParticipantNumberEnc: true },
    }),
  ]);

  const overlay =
    getPaceBudgetOverlay(participantId, categoryCode) ??
    defaultPaceBudgetOverlay(participantId, categoryCode);

  let status: PaceEndorsementStatus = mapRelationshipStatus(
    relationship?.status
  );
  const expiration = new Date(overlay.expirationDate);
  if (Number.isFinite(expiration.getTime()) && expiration.getTime() < Date.now()) {
    status = "EXPIRED";
  }

  const decryptedNdis = profile?.ndisParticipantNumberEnc
    ? decryptNdisNumber(profile.ndisParticipantNumberEnc)
    : null;

  const paceProfile: ParticipantPaceProfile = {
    ndisNumber: overlay.ndisNumber ?? decryptedNdis ?? null,
    supportCategoryCode: categoryCode,
    endorsedProviderId: relationship?.providerOrgId ?? null,
    expirationDate: overlay.expirationDate,
    remainingCategoryBudget: overlay.remainingCategoryBudget,
    totalCategoryBudget: overlay.totalCategoryBudget,
  };

  const warnings: string[] = [];
  const budgetRatio =
    paceProfile.totalCategoryBudget > 0
      ? paceProfile.remainingCategoryBudget / paceProfile.totalCategoryBudget
      : 0;
  if (budgetRatio < 0.1) {
    warnings.push(
      "Remaining category budget is below 10% — review plan funding before claiming."
    );
  }

  const authorized =
    relationship?.providerOrgId === providerId && status === "ACTIVE";

  if (!authorized) {
    if (status === "EXPIRED") {
      warnings.push("PACE endorsement has expired for this category.");
    } else if (status === "PENDING_APPROVAL") {
      warnings.push("PACE endorsement is pending approval.");
    } else if (status === "NOT_ENDORSED") {
      warnings.push(
        "Provider is not endorsed under this participant's PACE plan category."
      );
    }
  }

  return { authorized, status, profile: paceProfile, warnings };
}
