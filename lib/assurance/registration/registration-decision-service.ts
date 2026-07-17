import type {
  AssuranceReadinessDecision,
  NdisRegistrationApplicationStatus,
} from "@prisma/client";

/**
 * Registration status never equals platform approval or go-live.
 */
export function registrationImpliesPlatformApproval(
  status: NdisRegistrationApplicationStatus
): false {
  void status;
  return false;
}

export function deriveRegistrationReadinessDecision(params: {
  status: NdisRegistrationApplicationStatus;
  includes0137: boolean;
  evidenceComplete: boolean;
  assuranceDecision: AssuranceReadinessDecision;
}): {
  readinessDecision: AssuranceReadinessDecision;
  canMarkReadyToSubmit: boolean;
  notes: string[];
} {
  const notes: string[] = [
    "Registration records track application state only — not NDIA or MapAble production approval.",
  ];

  if (!params.evidenceComplete) {
    return {
      readinessDecision: "not_ready",
      canMarkReadyToSubmit: false,
      notes: [...notes, "Registration evidence incomplete."],
    };
  }

  if (params.includes0137) {
    notes.push("Registration group 0137 is included in this application pathway.");
  }

  if (
    params.assuranceDecision === "blocked" ||
    params.assuranceDecision === "not_ready"
  ) {
    return {
      readinessDecision: "blocked",
      canMarkReadyToSubmit: false,
      notes: [...notes, "Assurance readiness blocks registration submission readiness."],
    };
  }

  if (
    params.status === "approved_externally" ||
    params.status === "submitted_externally"
  ) {
    return {
      readinessDecision: "ready_for_external_assurance",
      canMarkReadyToSubmit: false,
      notes: [
        ...notes,
        "External registration status does not unlock production activation.",
      ],
    };
  }

  return {
    readinessDecision: "ready_for_registration_submission",
    canMarkReadyToSubmit: true,
    notes,
  };
}
