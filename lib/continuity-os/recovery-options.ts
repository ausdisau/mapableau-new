import type { ImpactVersion } from "@/lib/continuity-os/impact";
import { getPlaybook } from "@/lib/continuity-os/playbooks";
import type {
  AvailabilityState,
  ContinuityPreferenceSet,
  RecoveryOptionView,
} from "@/lib/continuity-os/types";

export interface GenerateRecoveryOptionsInput {
  failureDependencyId: string;
  playbookKey: string;
  impact: ImpactVersion;
  preferences?: ContinuityPreferenceSet;
  /** Hard Access Passport / functional requirements that must be met. */
  hardRequirements: string[];
  /** Claimed replacement features (e.g. vehicle has ramp). */
  claimedReplacementFeatures?: string[];
  /** Whether a partner has confirmed availability in a canonical service. */
  partnerConfirmedAvailable?: boolean;
  /** Known additional cost string for transparency. */
  knownAdditionalCost?: string;
}

function availabilityForClaim(params: {
  partnerConfirmedAvailable?: boolean;
  hardRequirementsMet: boolean;
  needsHuman?: boolean;
}): AvailabilityState {
  if (params.needsHuman) return "human_review_required";
  if (!params.hardRequirementsMet) return "blocked";
  if (params.partnerConfirmedAvailable) return "requires_confirmation";
  return "unknown";
}

/**
 * Deterministic recovery option generation.
 * Unconfirmed providers/vehicles are never labelled verified_available.
 */
export function generateRecoveryOptions(
  input: GenerateRecoveryOptionsInput
): RecoveryOptionView[] {
  const playbook = getPlaybook(input.playbookKey);
  if (!playbook) return [];

  if (playbook.specialistHighRisk) {
    return [
      {
        id: "specialist_human_pathway",
        title: "Specialist human pathway",
        summary:
          "This concern is routed to an authorised human pathway. AURA cannot investigate or close it. Ordinary automated recovery does not run.",
        horizon: "immediate",
        availability: "human_review_required",
        hardRequirementsMet: true,
        remainingUnknowns: ["specialist response time"],
        requiredDisclosure: ["Minimal safe-channel contact fields only"],
        peopleInvolved: playbook.requiredHumanRoles,
        preferenceMatch: input.preferences?.preferHumanCoordinator
          ? ["preferHumanCoordinator"]
          : [],
        preferenceConflicts: [],
        approvalsRequired: ["participant_safe_channel_consent"],
        playbookKey: playbook.key,
      },
    ];
  }

  const prefs = input.preferences ?? {};
  const options: RecoveryOptionView[] = [];

  if (input.failureDependencyId === "accessible_transport") {
    const hardMet = input.hardRequirements.every((req) =>
      (input.claimedReplacementFeatures ?? []).includes(req)
    );

    const replacementAvailability = availabilityForClaim({
      partnerConfirmedAvailable: input.partnerConfirmedAvailable,
      hardRequirementsMet: hardMet,
    });

    options.push({
      id: "replacement_accessible_transport",
      title: "Replacement accessible transport",
      summary: hardMet
        ? "Request a replacement trip that meets selected access requirements. A request is not a confirmed ride."
        : "Excluded: replacement does not meet hard access requirements (for example ramp).",
      horizon: "immediate",
      availability: hardMet ? replacementAvailability : "blocked",
      hardRequirementsMet: hardMet,
      excludedReason: hardMet
        ? undefined
        : "Hard access requirement failed — inaccessible replacement excluded",
      remainingUnknowns: hardMet
        ? ["ride confirmation", "exact pickup time"]
        : ["no eligible verified vehicle"],
      requiredDisclosure: ["Pickup window", "Destination", "Vehicle access needs"],
      peopleInvolved: ["transport_operator", "participant"],
      timingNotes: "Preserves original appointment where possible",
      knownCost: input.knownAdditionalCost ?? "unknown — show before approval",
      estimatedCostSource: "provider_quote_or_agreement",
      expectedPayer: "per_service_agreement",
      preferenceMatch: prefs.preserveOriginalAppointment
        ? ["preserveOriginalAppointment"]
        : [],
      preferenceConflicts: prefs.avoidUnfamiliarWorkers
        ? []
        : [],
      approvalsRequired: ["participant_transport_request"],
      fallback: "human_transport_coordination",
      playbookKey: playbook.key,
    });

    options.push({
      id: "move_appointment",
      title: "Move appointment / start time",
      summary:
        "Keep preferred arrangements where possible by moving the start time. New transport required; availability unknown until confirmed.",
      horizon: "short_term",
      availability: "unknown",
      hardRequirementsMet: true,
      remainingUnknowns: [
        "employer acceptance",
        "new transport availability",
      ],
      requiredDisclosure: prefs.minimiseAdditionalDisclosure
        ? ["Minimal timing change only"]
        : ["Timing change", "Optional reason"],
      peopleInvolved: ["employer", "participant", "transport_operator"],
      knownCost: "unknown until rebooked",
      preferenceMatch: [
        ...(prefs.minimiseAdditionalDisclosure
          ? ["minimiseAdditionalDisclosure"]
          : []),
        ...(prefs.avoidUnfamiliarWorkers ? ["avoidUnfamiliarWorkers"] : []),
      ],
      preferenceConflicts: prefs.preserveOriginalAppointment
        ? ["preserveOriginalAppointment"]
        : [],
      approvalsRequired: [
        "participant_reschedule",
        "employer_notification_if_selected",
      ],
      playbookKey: playbook.key,
    });

    options.push({
      id: "human_transport_coordination",
      title: "Human transport coordinator",
      summary:
        "Ask a human transport coordinator to help. The coordinator does not receive broad account access.",
      horizon: "immediate",
      availability: "human_review_required",
      hardRequirementsMet: true,
      remainingUnknowns: ["coordinator queue time"],
      requiredDisclosure: ["Mission goal", "Failed transport dependency", "Access needs"],
      peopleInvolved: ["transport_coordinator"],
      preferenceMatch: prefs.preferHumanCoordinator
        ? ["preferHumanCoordinator"]
        : [],
      preferenceConflicts: [],
      approvalsRequired: ["participant_human_assistance"],
      playbookKey: playbook.key,
    });
  }

  if (input.failureDependencyId === "morning_support_worker") {
    const unfamiliarOk = prefs.avoidUnfamiliarWorkers !== true;
    options.push({
      id: "backup_worker_via_care",
      title: "Replacement worker via Care recovery",
      summary: unfamiliarOk
        ? "Prepare a Care BackupShiftRecovery proposal. A proposed worker is not an assigned worker."
        : "Conflicts with preference to avoid unfamiliar workers — still shown with conflict label; not auto-assigned.",
      horizon: "immediate",
      availability: "requires_confirmation",
      hardRequirementsMet: true,
      remainingUnknowns: ["worker assignment confirmation", "credentials at assignment time"],
      requiredDisclosure: ["Shift time", "Support tasks"],
      peopleInvolved: ["provider", "worker", "participant"],
      preferenceMatch: [],
      preferenceConflicts: unfamiliarOk ? [] : ["avoidUnfamiliarWorkers"],
      approvalsRequired: ["participant_care_backup"],
      playbookKey: playbook.key,
    });

    options.push({
      id: "change_transport_or_start",
      title: "Change transport or start time",
      summary:
        "Adjust transport pickup or start time instead of accepting an unfamiliar worker.",
      horizon: "immediate",
      availability: "unknown",
      hardRequirementsMet: true,
      remainingUnknowns: ["transport rebook", "employer acceptance"],
      requiredDisclosure: ["Timing change"],
      peopleInvolved: ["participant", "transport_operator", "employer"],
      preferenceMatch: prefs.avoidUnfamiliarWorkers
        ? ["avoidUnfamiliarWorkers"]
        : [],
      preferenceConflicts: [],
      approvalsRequired: ["participant_timing_change"],
      playbookKey: playbook.key,
    });

    options.push({
      id: "employer_notification_proposal",
      title: "Employer notification proposal",
      summary:
        "Prepare a disclosure-minimised employer notification. Requires separate approval before send.",
      horizon: "immediate",
      availability: "requires_confirmation",
      hardRequirementsMet: true,
      remainingUnknowns: ["employer response"],
      requiredDisclosure: ["Arrival delay only — no diagnosis"],
      peopleInvolved: ["employer", "participant"],
      preferenceMatch: prefs.minimiseAdditionalDisclosure
        ? ["minimiseAdditionalDisclosure"]
        : [],
      preferenceConflicts: [],
      approvalsRequired: ["participant_employer_notify"],
      playbookKey: playbook.key,
    });

    // Explicitly exclude "attend without required support"
    options.push({
      id: "attend_without_worker",
      title: "Attend without required support",
      summary: "Excluded — fails selected required support condition.",
      horizon: "immediate",
      availability: "blocked",
      hardRequirementsMet: false,
      excludedReason: "Fails selected required support condition",
      remainingUnknowns: [],
      requiredDisclosure: [],
      peopleInvolved: [],
      preferenceMatch: [],
      preferenceConflicts: [],
      approvalsRequired: [],
      playbookKey: playbook.key,
    });
  }

  // Never emit verified_available without partner confirmation AND hard requirements.
  for (const opt of options) {
    if (
      opt.availability === ("verified_available" as AvailabilityState) &&
      !input.partnerConfirmedAvailable
    ) {
      opt.availability = "requires_confirmation";
    }
  }

  return options;
}

export function compareRecoveryOptions(options: RecoveryOptionView[]): {
  selectable: RecoveryOptionView[];
  excluded: RecoveryOptionView[];
} {
  return {
    selectable: options.filter(
      (o) => o.hardRequirementsMet && o.availability !== "blocked"
    ),
    excluded: options.filter(
      (o) => !o.hardRequirementsMet || o.availability === "blocked"
    ),
  };
}
