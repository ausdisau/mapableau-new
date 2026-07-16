import type { ContinuityPlaybookDefinition } from "@/lib/continuity-os/recovery/playbooks";

export type AvailabilityState =
  | "verified_available"
  | "available_with_conditions"
  | "requires_confirmation"
  | "unknown"
  | "blocked"
  | "human_review_required";

export interface RecoveryOptionDraft {
  optionKey: string;
  label: string;
  description: string;
  availabilityState: AvailabilityState;
  preservesOriginalGoal: boolean;
  hardRequirementsMet: boolean;
  excludedReason?: string;
  unknowns: string[];
  disclosure: Record<string, unknown>;
  people: string[];
  timing: Record<string, unknown>;
  cost: {
    knownCostCents?: number | null;
    estimated: boolean;
    whoPays: string;
    fundingUncertainty: string;
    participantApprovalRequired: boolean;
  };
  preferenceMatch: Record<string, boolean | string>;
  evidenceConfidence: "unverified" | "low" | "medium" | "high";
  approvalsRequired: string[];
  fallback: Record<string, unknown>;
  horizon: "immediate" | "short_term" | "medium_term" | "long_term";
}

export interface OptionGenerationContext {
  playbook: ContinuityPlaybookDefinition;
  originalGoal: string;
  hardRequirements: string[];
  preferences: {
    avoidUnfamiliarWorkers?: boolean;
    preserveAppointment?: boolean;
    minimiseDisclosure?: boolean;
    preferHumanCoordinator?: boolean;
  };
  replacementVehicleAccessible?: boolean | null;
  replacementWorkerFamiliar?: boolean | null;
  simulatedOnly?: boolean;
}

/**
 * Deterministic recovery options. Unconfirmed services stay requires_confirmation/unknown.
 * Simulated availability is never verified_available.
 */
export function generateRecoveryOptions(
  ctx: OptionGenerationContext
): RecoveryOptionDraft[] {
  if (ctx.playbook.highRisk) {
    return [
      {
        optionKey: "specialist_human_escalation",
        label: "Specialist human pathway",
        description:
          "Route to an authorised human specialist pathway. Ordinary automated recovery is paused.",
        availabilityState: "human_review_required",
        preservesOriginalGoal: true,
        hardRequirementsMet: true,
        unknowns: ["specialist_queue_wait"],
        disclosure: { minimised: true, avoidDefaultSupporterContact: true },
        people: ctx.playbook.requiredHumanRoles,
        timing: { horizon: "immediate" },
        cost: {
          knownCostCents: 0,
          estimated: false,
          whoPays: "not_applicable",
          fundingUncertainty: "none",
          participantApprovalRequired: true,
        },
        preferenceMatch: { safetyFirst: true },
        evidenceConfidence: "high",
        approvalsRequired: ["participant"],
        fallback: { quickExit: true },
        horizon: "immediate",
      },
    ];
  }

  const options: RecoveryOptionDraft[] = [];

  if (ctx.playbook.code === "accessible_transport_cancellation") {
    const vehicleAccessible = ctx.replacementVehicleAccessible;
    if (vehicleAccessible === false) {
      options.push({
        optionKey: "inaccessible_vehicle_excluded",
        label: "Inaccessible replacement (excluded)",
        description:
          "Replacement vehicle does not meet the selected hard access requirement.",
        availabilityState: "blocked",
        preservesOriginalGoal: false,
        hardRequirementsMet: false,
        excludedReason: "hard_requirement_failed:accessible_vehicle",
        unknowns: [],
        disclosure: {},
        people: ["transport_operator"],
        timing: {},
        cost: {
          knownCostCents: null,
          estimated: true,
          whoPays: "unknown",
          fundingUncertainty: "unknown",
          participantApprovalRequired: true,
        },
        preferenceMatch: {},
        evidenceConfidence: "high",
        approvalsRequired: [],
        fallback: {},
        horizon: "immediate",
      });
    }

    options.push({
      optionKey: "verified_accessible_replacement",
      label: "Request verified accessible replacement",
      description:
        "Ask the transport service for a vehicle that meets your access requirements. This creates a request — not a confirmed ride.",
      availabilityState:
        ctx.simulatedOnly || vehicleAccessible == null
          ? "requires_confirmation"
          : vehicleAccessible
            ? "available_with_conditions"
            : "blocked",
      preservesOriginalGoal: ctx.preferences.preserveAppointment !== false,
      hardRequirementsMet: vehicleAccessible !== false,
      excludedReason:
        vehicleAccessible === false
          ? "hard_requirement_failed:accessible_vehicle"
          : undefined,
      unknowns:
        vehicleAccessible == null
          ? ["vehicle_availability", "driver_assignment"]
          : ["driver_assignment"],
      disclosure: {
        fields: ["pickup_window", "mobility_requirements"],
        omitted: ["full_access_passport", "unrelated_missions"],
      },
      people: ["transport_operator", "participant"],
      timing: { preservesOriginalWindow: ctx.preferences.preserveAppointment !== false },
      cost: {
        knownCostCents: null,
        estimated: true,
        whoPays: "per_service_agreement",
        fundingUncertainty: "possible_additional_cost",
        participantApprovalRequired: true,
      },
      preferenceMatch: {
        preserveAppointment: ctx.preferences.preserveAppointment !== false,
      },
      evidenceConfidence: "unverified",
      approvalsRequired: ["participant", "transport_service_confirmation"],
      fallback: { human_transport_coordination: true },
      horizon: "immediate",
    });

    options.push({
      optionKey: "human_transport_coordination",
      label: "Ask a human transport coordinator",
      description: "A human coordinator helps find options without automatic assignment.",
      availabilityState: "human_review_required",
      preservesOriginalGoal: true,
      hardRequirementsMet: true,
      unknowns: ["coordinator_response_time"],
      disclosure: { fields: ["goal", "access_requirements_slice"] },
      people: ["transport_coordinator"],
      timing: {},
      cost: {
        knownCostCents: 0,
        estimated: false,
        whoPays: "not_applicable",
        fundingUncertainty: "none",
        participantApprovalRequired: true,
      },
      preferenceMatch: {
        preferHumanCoordinator: ctx.preferences.preferHumanCoordinator === true,
      },
      evidenceConfidence: "medium",
      approvalsRequired: ["participant"],
      fallback: {},
      horizon: "immediate",
    });

    options.push({
      optionKey: "reschedule_with_employer_notice",
      label: "Propose reschedule and employer notice",
      description:
        "Keep preferred arrangements where possible. Employer notification requires separate approval.",
      availabilityState: "requires_confirmation",
      preservesOriginalGoal: false,
      hardRequirementsMet: true,
      unknowns: ["employer_availability", "new_transport_slot"],
      disclosure: {
        fields: ctx.preferences.minimiseDisclosure
          ? ["delay_notice"]
          : ["delay_notice", "support_context_slice"],
      },
      people: ["employer", "participant"],
      timing: { changesAppointment: true },
      cost: {
        knownCostCents: null,
        estimated: true,
        whoPays: "unknown",
        fundingUncertainty: "unknown",
        participantApprovalRequired: true,
      },
      preferenceMatch: {
        minimiseDisclosure: ctx.preferences.minimiseDisclosure === true,
      },
      evidenceConfidence: "unverified",
      approvalsRequired: ["participant", "separate_employer_notification_approval"],
      fallback: {},
      horizon: "short_term",
    });
  }

  if (ctx.playbook.code === "support_worker_cancellation") {
    if (ctx.preferences.avoidUnfamiliarWorkers && ctx.replacementWorkerFamiliar === false) {
      options.push({
        optionKey: "unfamiliar_worker_excluded",
        label: "Unfamiliar replacement worker (excluded by preference)",
        description:
          "Your preference is to avoid unfamiliar workers. This option is shown as excluded, not assigned.",
        availabilityState: "blocked",
        preservesOriginalGoal: true,
        hardRequirementsMet: true,
        excludedReason: "participant_preference:avoid_unfamiliar_workers",
        unknowns: [],
        disclosure: {},
        people: ["provider_manager"],
        timing: {},
        cost: {
          knownCostCents: null,
          estimated: true,
          whoPays: "per_service_agreement",
          fundingUncertainty: "unknown",
          participantApprovalRequired: true,
        },
        preferenceMatch: { avoidUnfamiliarWorkers: true },
        evidenceConfidence: "medium",
        approvalsRequired: [],
        fallback: {},
        horizon: "immediate",
      });
    }

    options.push({
      optionKey: "backup_shift_proposal",
      label: "Prepare backup shift proposal",
      description:
        "Uses existing Care backup recovery services after approval. A proposal is not an assigned worker.",
      availabilityState: "requires_confirmation",
      preservesOriginalGoal: true,
      hardRequirementsMet: true,
      unknowns: ["candidate_availability"],
      disclosure: { fields: ["shift_window", "access_needs_slice"] },
      people: ["provider_manager", "participant"],
      timing: {},
      cost: {
        knownCostCents: null,
        estimated: true,
        whoPays: "per_service_agreement",
        fundingUncertainty: "unknown",
        participantApprovalRequired: true,
      },
      preferenceMatch: {
        avoidUnfamiliarWorkers: ctx.preferences.avoidUnfamiliarWorkers === true,
      },
      evidenceConfidence: "unverified",
      approvalsRequired: ["participant"],
      fallback: { change_transport_or_start_time: true },
      horizon: "immediate",
    });

    options.push({
      optionKey: "change_transport_or_start_time",
      label: "Change transport or start time",
      description: "Adjust dependent timing instead of replacing the worker.",
      availabilityState: "requires_confirmation",
      preservesOriginalGoal: false,
      hardRequirementsMet: true,
      unknowns: ["new_transport_slot"],
      disclosure: { fields: ["timing_change"] },
      people: ["transport_operator", "participant"],
      timing: { changesAppointment: true },
      cost: {
        knownCostCents: null,
        estimated: true,
        whoPays: "unknown",
        fundingUncertainty: "unknown",
        participantApprovalRequired: true,
      },
      preferenceMatch: {},
      evidenceConfidence: "unverified",
      approvalsRequired: ["participant"],
      fallback: {},
      horizon: "immediate",
    });
  }

  if (options.length === 0) {
    options.push({
      optionKey: "human_assistance",
      label: "Ask a human coordinator",
      description: "Escalate to a human coordinator with minimised fields.",
      availabilityState: "human_review_required",
      preservesOriginalGoal: true,
      hardRequirementsMet: true,
      unknowns: ["coordinator_response_time"],
      disclosure: { fields: ["goal", "failure_summary"] },
      people: ctx.playbook.requiredHumanRoles,
      timing: {},
      cost: {
        knownCostCents: 0,
        estimated: false,
        whoPays: "not_applicable",
        fundingUncertainty: "none",
        participantApprovalRequired: true,
      },
      preferenceMatch: {},
      evidenceConfidence: "medium",
      approvalsRequired: ["participant"],
      fallback: {},
      horizon: "immediate",
    });
  }

  // Simulated options can never be verified_available.
  if (ctx.simulatedOnly) {
    for (const option of options) {
      if (option.availabilityState === "verified_available") {
        option.availabilityState = "requires_confirmation";
        option.unknowns = [...option.unknowns, "simulated_availability"];
      }
    }
  }

  return options.filter((o) => o.availabilityState !== "blocked" || Boolean(o.excludedReason));
}

export function compareRecoveryOptions(options: RecoveryOptionDraft[]): Array<{
  optionKey: string;
  label: string;
  availabilityState: AvailabilityState;
  preservesOriginalGoal: boolean;
  hardRequirementsMet: boolean;
  excluded: boolean;
  costSummary: string;
}> {
  return options.map((o) => ({
    optionKey: o.optionKey,
    label: o.label,
    availabilityState: o.availabilityState,
    preservesOriginalGoal: o.preservesOriginalGoal,
    hardRequirementsMet: o.hardRequirementsMet,
    excluded: o.availabilityState === "blocked" || !o.hardRequirementsMet,
    costSummary: o.cost.estimated
      ? `Estimated — ${o.cost.whoPays} (${o.cost.fundingUncertainty})`
      : `Known — ${o.cost.whoPays}`,
  }));
}
