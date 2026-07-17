/**
 * Wave 11 — Participant Continuity Profile.
 *
 * The profile captures the participant's own words about goals and essential
 * supports. Essential support is PARTICIPANT-DEFINED (or defined by an
 * authorised human), NEVER inferred from diagnosis. Prohibited actions the
 * participant lists here are always honoured — they cannot be overridden by
 * a standing instruction.
 */

import type {
  ContinuityRequirement,
  ParticipantContinuityProfile,
  StandingRecoveryInstruction,
  StandingRecoveryInstructionScope,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface UpsertProfileInput {
  participantId: string;
  organisationId?: string | null;
  goalsNarrative?: string | null;
  essentialSupports?: Array<{ label: string; description?: string }>;
  prohibitedActions?: string[];
  communicationPreference?: {
    preferredChannel?: "in_app" | "sms" | "email" | "phone_human" | "postal_human";
    languagePreference?: string;
    contactHours?: string;
  };
  interpreterRequired?: boolean;
  reviewedById?: string | null;
}

export async function upsertContinuityProfile(input: UpsertProfileInput): Promise<ParticipantContinuityProfile> {
  return prisma.participantContinuityProfile.upsert({
    where: { participantId: input.participantId },
    update: {
      organisationId: input.organisationId ?? undefined,
      goalsNarrative: input.goalsNarrative ?? undefined,
      essentialSupportsJson: input.essentialSupports ?? undefined,
      prohibitedActionsJson: input.prohibitedActions ?? undefined,
      communicationPreferenceJson: input.communicationPreference ?? undefined,
      interpreterRequired: input.interpreterRequired ?? undefined,
      reviewedById: input.reviewedById ?? undefined,
      reviewedAt: input.reviewedById ? new Date() : undefined,
    },
    create: {
      participantId: input.participantId,
      organisationId: input.organisationId ?? null,
      goalsNarrative: input.goalsNarrative ?? null,
      essentialSupportsJson: input.essentialSupports ?? undefined,
      prohibitedActionsJson: input.prohibitedActions ?? undefined,
      communicationPreferenceJson: input.communicationPreference ?? undefined,
      interpreterRequired: input.interpreterRequired ?? false,
      reviewedById: input.reviewedById ?? null,
      reviewedAt: input.reviewedById ? new Date() : null,
    },
  });
}

export async function readContinuityProfile(participantId: string) {
  return prisma.participantContinuityProfile.findUnique({
    where: { participantId },
    include: { requirements: true, standingInstructions: true },
  });
}

export interface AddRequirementInput {
  profileId: string;
  label: string;
  description?: string;
  essential: boolean;
  scope: string;
  detailsJson?: Record<string, unknown>;
  createdById: string;
}

export async function addContinuityRequirement(input: AddRequirementInput): Promise<ContinuityRequirement> {
  return prisma.continuityRequirement.create({
    data: {
      profileId: input.profileId,
      label: input.label,
      description: input.description,
      essential: input.essential,
      scope: input.scope,
      detailsJson: asJson(input.detailsJson ?? undefined),
      createdById: input.createdById,
    },
  });
}

/**
 * Guard used by executive code paths: an essential-support determination MUST
 * come from the participant profile itself (or an authorised human update).
 * Diagnosis, plan type, or NDIS category are NEVER acceptable sources.
 */
export function assertEssentialSourceIsHumanDefined(source: {
  origin: "participant_profile" | "authorised_delegate_update" | "coordinator_note_confirmed_with_participant" | "diagnosis" | "plan_category" | "ai_inference";
}): void {
  const allowed = new Set([
    "participant_profile",
    "authorised_delegate_update",
    "coordinator_note_confirmed_with_participant",
  ]);
  if (!allowed.has(source.origin)) {
    throw new Error(`ESSENTIAL_SUPPORT_SOURCE_NOT_ALLOWED_${source.origin.toUpperCase()}`);
  }
}
