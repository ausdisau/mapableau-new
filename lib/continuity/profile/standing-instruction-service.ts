/**
 * Wave 11 — Standing Recovery Instructions.
 *
 * Narrow, revocable, participant-authored rules. Rechecked at execution
 * time. NEVER authorises anything the participant has listed as prohibited,
 * a Wave 10 AURA prohibited action (billing/claim/payment/consent/delegation
 * approvals) or any emergency-service dispatch.
 *
 * Standing instructions are NEVER auto-created by AURA or by heuristics
 * over history. They MUST originate from the participant (or an authorised
 * delegate/coordinator with participant sign-off).
 */

import type {
  ParticipantContinuityProfile,
  StandingRecoveryInstruction,
  StandingRecoveryInstructionScope,
  StandingRecoveryInstructionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const AURA_PROHIBITED_ACTION_SLUGS = new Set([
  "billing.approve_invoice",
  "billing.approve_claim",
  "payments.approve",
  "consent.grant_or_alter",
  "delegation.appoint_or_alter",
  "incident.reportability_decide",
  "safeguarding.close",
  "safety.release_kill_switch",
  "integration.activate_production",
  "emergency.dispatch",
  "emergency.contact_000",
]);

export interface CreateStandingInstructionInput {
  profileId: string;
  scope: StandingRecoveryInstructionScope;
  title: string;
  instructions: {
    allowedActionSlugs: string[];
    prohibitedActionSlugs?: string[];
    narrative?: string;
    requiresParticipantConfirmationAtExecution?: boolean;
    requiresDelegateConfirmationAtExecution?: boolean;
    maxAutoApprovalRiskTier?: "low_readonly" | "medium_reversible" | "high_irreversible";
  };
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdById: string;
  authorSource: "participant_self" | "authorised_delegate" | "coordinator_confirmed_with_participant";
}

export function assertInstructionAuthoredByHuman(source: CreateStandingInstructionInput["authorSource"]): void {
  const allowed = new Set([
    "participant_self",
    "authorised_delegate",
    "coordinator_confirmed_with_participant",
  ]);
  if (!allowed.has(source)) {
    throw new Error("STANDING_INSTRUCTION_SOURCE_NOT_HUMAN");
  }
}

export function containsProhibitedAction(actions: string[]): string | null {
  for (const a of actions) {
    if (AURA_PROHIBITED_ACTION_SLUGS.has(a)) return a;
  }
  return null;
}

export async function createStandingInstruction(
  input: CreateStandingInstructionInput
): Promise<StandingRecoveryInstruction> {
  assertInstructionAuthoredByHuman(input.authorSource);
  const prohibited = containsProhibitedAction(input.instructions.allowedActionSlugs);
  if (prohibited) {
    throw new Error(`STANDING_INSTRUCTION_CANNOT_AUTHORISE_${prohibited.toUpperCase()}`);
  }
  if (input.instructions.maxAutoApprovalRiskTier === "high_irreversible") {
    throw new Error("STANDING_INSTRUCTION_HIGH_IRREVERSIBLE_NOT_ALLOWED");
  }
  return prisma.standingRecoveryInstruction.create({
    data: {
      profileId: input.profileId,
      scope: input.scope,
      status: "draft",
      title: input.title,
      instructionsJson: input.instructions,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      createdById: input.createdById,
    },
  });
}

export async function revokeStandingInstruction(
  id: string,
  revokedById: string
): Promise<StandingRecoveryInstruction> {
  return prisma.standingRecoveryInstruction.update({
    where: { id },
    data: {
      status: "revoked",
      revokedById,
      revokedAt: new Date(),
    },
  });
}

export interface EvaluateInstructionInput {
  instruction: StandingRecoveryInstruction;
  actionSlug: string;
  profile?: ParticipantContinuityProfile | null;
  now?: Date;
}

export interface InstructionEvaluationResult {
  authorised: boolean;
  reason: string;
  requiresParticipantConfirmation: boolean;
  requiresDelegateConfirmation: boolean;
}

/**
 * Rechecked at execution — validates freshness, participant prohibitions,
 * and hard-coded AURA prohibitions. Never authorises high_irreversible.
 */
export function evaluateStandingInstruction(input: EvaluateInstructionInput): InstructionEvaluationResult {
  const now = input.now ?? new Date();
  const inst = input.instruction;
  const parsed = (inst.instructionsJson as {
    allowedActionSlugs?: string[];
    prohibitedActionSlugs?: string[];
    requiresParticipantConfirmationAtExecution?: boolean;
    requiresDelegateConfirmationAtExecution?: boolean;
    maxAutoApprovalRiskTier?: string;
  }) ?? {};
  const allowed = new Set(parsed.allowedActionSlugs ?? []);
  const prohibitedInInstruction = new Set(parsed.prohibitedActionSlugs ?? []);

  if (inst.status !== "active") {
    return {
      authorised: false,
      reason: "not_active",
      requiresParticipantConfirmation: true,
      requiresDelegateConfirmation: false,
    };
  }
  if (inst.effectiveFrom && inst.effectiveFrom.getTime() > now.getTime()) {
    return {
      authorised: false,
      reason: "not_yet_effective",
      requiresParticipantConfirmation: true,
      requiresDelegateConfirmation: false,
    };
  }
  if (inst.effectiveTo && inst.effectiveTo.getTime() < now.getTime()) {
    return {
      authorised: false,
      reason: "expired",
      requiresParticipantConfirmation: true,
      requiresDelegateConfirmation: false,
    };
  }

  if (AURA_PROHIBITED_ACTION_SLUGS.has(input.actionSlug)) {
    return {
      authorised: false,
      reason: `aura_prohibited:${input.actionSlug}`,
      requiresParticipantConfirmation: true,
      requiresDelegateConfirmation: false,
    };
  }

  if (prohibitedInInstruction.has(input.actionSlug)) {
    return {
      authorised: false,
      reason: "prohibited_in_instruction",
      requiresParticipantConfirmation: true,
      requiresDelegateConfirmation: false,
    };
  }

  if (input.profile) {
    const participantProhibited = (input.profile.prohibitedActionsJson as string[] | null) ?? [];
    if (participantProhibited.includes(input.actionSlug)) {
      return {
        authorised: false,
        reason: "participant_prohibited",
        requiresParticipantConfirmation: true,
        requiresDelegateConfirmation: false,
      };
    }
  }

  if (!allowed.has(input.actionSlug)) {
    return {
      authorised: false,
      reason: "not_in_allowlist",
      requiresParticipantConfirmation: true,
      requiresDelegateConfirmation: false,
    };
  }

  return {
    authorised: true,
    reason: "ok",
    requiresParticipantConfirmation: parsed.requiresParticipantConfirmationAtExecution ?? false,
    requiresDelegateConfirmation: parsed.requiresDelegateConfirmationAtExecution ?? false,
  };
}
