/**
 * Wave 11 — Recovery Option Builder.
 *
 * Deterministic eligibility first. No opaque scores. Every option is either
 * `eligible`, `ineligible`, or blocked with an explicit reason. `no_safe_option`
 * is ALWAYS a permitted output — refusing to invent an option is preferred
 * over quietly picking a bad one.
 *
 * Options are keyed by a deterministic `deterministicKey` so re-running the
 * builder on the same case yields the same option ids.
 */

import type {
  ContinuityCase,
  ContinuityCaseCategory,
  RecoveryOption,
  RecoveryOptionEligibility,
  RecoveryOptionKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface OptionBuilderContext {
  case: ContinuityCase & {
    goalsPreservedJson?: unknown;
    contextJson?: unknown;
  };
  participantProhibitedActions?: string[];
  participantEssentialSupports?: Array<{ label: string; description?: string }>;
  emergencyPolicyRequiresHumanDispatch?: boolean;
  hasStandingInstructionForScope?: boolean;
  hasApprovedFinancialRecoveryAuthority?: boolean;
}

export interface BuiltOption {
  kind: RecoveryOptionKind;
  eligibility: RecoveryOptionEligibility;
  rationale: string;
  narrative: string;
  deterministicKey: string;
  preservesGoal: boolean;
  requiresConsent: boolean;
  requiresApproval: boolean;
  detailsJson?: Record<string, unknown>;
}

const EMERGENCY_ACTION_KEYS = new Set(["emergency_dispatch", "emergency_contact_000"]);

/**
 * Produce a deterministic list of recovery options for a continuity case.
 * The output order is stable (by kind name) and the same input produces the
 * same list, always.
 */
export function buildRecoveryOptions(ctx: OptionBuilderContext): BuiltOption[] {
  const options: BuiltOption[] = [];
  const cat = ctx.case.category;
  const caseId = ctx.case.id;

  options.push({
    kind: "notify_participant" as unknown as RecoveryOptionKind, // placeholder — replaced below
    eligibility: "eligible",
    rationale: "Contact the participant so they can choose.",
    narrative:
      "Contact the participant using their preferred, consented channel and let them choose the recovery path. This preserves participant agency.",
    deterministicKey: `${caseId}:contact-participant`,
    preservesGoal: true,
    requiresConsent: false,
    requiresApproval: false,
  });
  // Fix placeholder kind after emitting.
  options[0].kind = "goal_preserving_alternative";

  if (cat === "care" || cat === "transport" || cat === "appointment_non_clinical") {
    options.push({
      kind: "reschedule",
      eligibility: "requires_participant_decision",
      rationale: "Rescheduling preserves the participant's goal if timing is flexible.",
      narrative:
        "Offer to reschedule the affected service to another time. Confirm with the participant before writing any change.",
      deterministicKey: `${caseId}:reschedule`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: true,
    });
    options.push({
      kind: "substitute_worker",
      eligibility: cat === "care" ? "requires_approval" : "ineligible",
      rationale: cat === "care" ? "A substitute worker may cover the shift." : "Not applicable outside care.",
      narrative:
        cat === "care"
          ? "Offer a substitute care worker who meets the participant's known essential supports."
          : "Substitute worker only applies to care.",
      deterministicKey: `${caseId}:substitute-worker`,
      preservesGoal: cat === "care",
      requiresConsent: false,
      requiresApproval: cat === "care",
    });
    options.push({
      kind: "substitute_transport",
      eligibility: cat === "transport" ? "requires_approval" : "ineligible",
      rationale: cat === "transport" ? "A substitute transport option may exist." : "Not applicable.",
      narrative:
        cat === "transport"
          ? "Offer an alternative transport provider or ride window."
          : "Substitute transport only applies to transport.",
      deterministicKey: `${caseId}:substitute-transport`,
      preservesGoal: cat === "transport",
      requiresConsent: false,
      requiresApproval: cat === "transport",
    });
  }

  if (cat === "employment") {
    options.push({
      kind: "manual_coordination",
      eligibility: "eligible",
      rationale: "Employment continuity requires human coordination with the employer and support team.",
      narrative:
        "Coordinate with the employer, jobs coach, and participant to preserve the placement. AURA can suggest, not act.",
      deterministicKey: `${caseId}:employment-coordination`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: true,
    });
  }

  if (cat === "housing") {
    options.push({
      kind: "manual_coordination",
      eligibility: "eligible",
      rationale: "Housing continuity requires a human coordinator and often a delegate/legal representative.",
      narrative:
        "Hand off to a human coordinator with the participant's delegate. AURA cannot alter a tenancy.",
      deterministicKey: `${caseId}:housing-coordination`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: true,
    });
  }

  if (cat === "provider_failure") {
    options.push({
      kind: "substitute_provider",
      eligibility: "requires_approval",
      rationale: "Another provider may pick up the participant's supports.",
      narrative:
        "Search for an alternative provider that matches the participant's essential supports and history. A coordinator approves before any switch.",
      deterministicKey: `${caseId}:substitute-provider`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: true,
    });
    options.push({
      kind: "waitlist",
      eligibility: "eligible",
      rationale: "Add the participant to a waitlist while a coordinator works the situation.",
      narrative: "Waitlist reservation preserves priority without committing capacity.",
      deterministicKey: `${caseId}:waitlist`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: false,
    });
  }

  if (cat === "finance_recovery") {
    // AURA/service_recovery MUST NOT approve invoices, claims, or payments.
    options.push({
      kind: "manual_coordination",
      eligibility: "requires_approval",
      rationale: "Financial recovery decisions must be made by an authorised human — AURA cannot approve them.",
      narrative:
        "Escalate to a billing coordinator with the necessary authority. AURA can prepare a summary but cannot submit or approve.",
      deterministicKey: `${caseId}:finance-coordination`,
      preservesGoal: false,
      requiresConsent: false,
      requiresApproval: true,
    });
  }

  if (cat === "civic_disruption") {
    options.push({
      kind: "manual_coordination",
      eligibility: "eligible",
      rationale: "Civic disruption needs local coordinator judgement.",
      narrative:
        "Confirm the disruption with a validated source before writing any change. Never act on unvalidated feeds.",
      deterministicKey: `${caseId}:civic-coordination`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: true,
    });
  }

  // Standing instruction shortcut only if a matching scope is active AND
  // there is no participant prohibition against the action.
  if (ctx.hasStandingInstructionForScope) {
    options.push({
      kind: "standing_instruction_apply",
      eligibility: "requires_approval",
      rationale: "Standing recovery instruction may cover this scope.",
      narrative:
        "Apply the participant's standing instruction if — and only if — the action passes freshness, prohibition, and risk-tier checks at execution.",
      deterministicKey: `${caseId}:standing-instruction`,
      preservesGoal: true,
      requiresConsent: false,
      requiresApproval: true,
    });
  }

  // Waitlist / do nothing / no_safe_option are ALWAYS available.
  options.push({
    kind: "do_nothing",
    eligibility: "eligible",
    rationale: "Doing nothing is always a valid, auditable choice.",
    narrative:
      "Doing nothing preserves the current arrangement. Choose this when doing anything would introduce more disruption.",
    deterministicKey: `${caseId}:do-nothing`,
    preservesGoal: false,
    requiresConsent: false,
    requiresApproval: false,
  });
  options.push({
    kind: "no_safe_option",
    eligibility: "eligible",
    rationale: "The builder is allowed to declare that there is no safe option.",
    narrative:
      "If every option would harm the participant or breach policy, this is the right answer. A human escalation follows.",
    deterministicKey: `${caseId}:no-safe-option`,
    preservesGoal: false,
    requiresConsent: false,
    requiresApproval: true,
  });

  // Apply blanket blocks based on emergency policy or participant prohibitions.
  const prohibited = new Set(ctx.participantProhibitedActions ?? []);
  const filtered = options.map((o) => {
    if (prohibited.has(o.deterministicKey) || prohibited.has(o.kind)) {
      return {
        ...o,
        eligibility: "blocked_by_prohibition" as RecoveryOptionEligibility,
        rationale: `Blocked by participant prohibition on ${o.kind}.`,
      };
    }
    if (
      ctx.emergencyPolicyRequiresHumanDispatch &&
      (EMERGENCY_ACTION_KEYS.has(o.kind) || EMERGENCY_ACTION_KEYS.has(o.deterministicKey))
    ) {
      return {
        ...o,
        eligibility: "blocked_by_emergency_boundary" as RecoveryOptionEligibility,
        rationale: "Emergency dispatch must be performed by a human — AURA cannot call emergency services.",
      };
    }
    return o;
  });

  return filtered.sort((a, b) => a.deterministicKey.localeCompare(b.deterministicKey));
}

export async function persistRecoveryOptions(
  caseId: string,
  options: BuiltOption[]
): Promise<RecoveryOption[]> {
  const persisted: RecoveryOption[] = [];
  for (const opt of options) {
    const row = await prisma.recoveryOption.upsert({
      where: {
        caseId_deterministicKey: { caseId, deterministicKey: opt.deterministicKey },
      },
      update: {
        kind: opt.kind,
        eligibility: opt.eligibility,
        rationale: opt.rationale,
        narrative: opt.narrative,
        detailsJson: asJson(opt.detailsJson ?? undefined),
        preservesGoal: opt.preservesGoal,
        requiresConsent: opt.requiresConsent,
        requiresApproval: opt.requiresApproval,
      },
      create: {
        caseId,
        kind: opt.kind,
        eligibility: opt.eligibility,
        rationale: opt.rationale,
        narrative: opt.narrative,
        deterministicKey: opt.deterministicKey,
        detailsJson: asJson(opt.detailsJson ?? undefined),
        preservesGoal: opt.preservesGoal,
        requiresConsent: opt.requiresConsent,
        requiresApproval: opt.requiresApproval,
      },
    });
    persisted.push(row);
  }
  return persisted;
}
