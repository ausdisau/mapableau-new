import type {
  FailureClass,
  FailureSeverity,
} from "@/lib/continuity-os/types";

export interface FailureSignalInput {
  source: string;
  sourceType:
    | "participant"
    | "supporter"
    | "worker"
    | "provider"
    | "transport"
    | "venue"
    | "equipment"
    | "accessibility_ops"
    | "journey_guardian"
    | "civic"
    | "receipt"
    | "handoff"
    | "navigator"
    | "system";
  service: string;
  missionId?: string;
  observedAt: string;
  receivedAt: string;
  evidence?: string;
  confidence: "low" | "medium" | "high";
  urgency: "low" | "normal" | "high" | "critical";
  publicOrPrivate: "public" | "private";
  affectedDependencyId?: string;
  verificationRequirement: string;
  rawSummary: string;
}

export interface ClassifiedFailure {
  failureClass: FailureClass;
  severity: FailureSeverity;
  describesServiceNotParticipant: true;
  summary: string;
  verificationStatus: "unverified" | "verified" | "rejected_forged" | "rejected_stale";
  playbookKeys: string[];
}

const CLASS_RULES: Array<{
  match: RegExp;
  failureClass: FailureClass;
  playbookKeys: string[];
}> = [
  {
    match: /inaccessible\s+replacement|lacks?\s+(ramp|hoist)|not\s+accessible/i,
    failureClass: "ACCESSIBILITY",
    playbookKeys: ["inaccessible_replacement_vehicle"],
  },
  {
    match: /transport.*(cancel|cancelled|canceled)|vehicle\s+cancel/i,
    failureClass: "AVAILABILITY",
    playbookKeys: ["accessible_transport_cancellation"],
  },
  {
    match: /worker.*(cancel|no-?show|did not arrive)|support\s+worker/i,
    failureClass: "AVAILABILITY",
    playbookKeys: ["support_worker_cancellation"],
  },
  {
    match: /equipment|charger|power-?chair|breakdown/i,
    failureClass: "AVAILABILITY",
    playbookKeys: ["equipment_breakdown"],
  },
  {
    match: /family\s+violence|unsafe\s+supporter|safe\s+mode/i,
    failureClass: "DATA_AND_AUTHORITY",
    playbookKeys: ["family_violence_safe_mode"],
  },
  {
    match: /handoff|hand-?off|rejected\s+responsibility/i,
    failureClass: "HANDOFF",
    playbookKeys: [],
  },
  {
    match: /fee|refund|charge|invoice/i,
    failureClass: "FINANCIAL",
    playbookKeys: [],
  },
  {
    match: /lift\s+outage|venue\s+clos|entrance\s+clos/i,
    failureClass: "ENVIRONMENTAL",
    playbookKeys: [],
  },
];

/**
 * Deterministic failure classification. Describes services/environment only.
 * AI cannot set final severity — this function is the authority for ContinuityOS.
 */
export function classifyFailureSignal(
  signal: FailureSignalInput,
  options?: { forged?: boolean; stale?: boolean; essentialService?: boolean }
): ClassifiedFailure {
  if (options?.forged) {
    return {
      failureClass: "DATA_AND_AUTHORITY",
      severity: "attention",
      describesServiceNotParticipant: true,
      summary: "Failure signal rejected as forged or unauthenticated",
      verificationStatus: "rejected_forged",
      playbookKeys: [],
    };
  }
  if (options?.stale) {
    return {
      failureClass: "TIMING",
      severity: "informational",
      describesServiceNotParticipant: true,
      summary: "Failure signal rejected as stale",
      verificationStatus: "rejected_stale",
      playbookKeys: [],
    };
  }

  const text = `${signal.rawSummary} ${signal.service} ${signal.affectedDependencyId ?? ""}`;
  const rule = CLASS_RULES.find((r) => r.match.test(text));
  const failureClass = rule?.failureClass ?? "AVAILABILITY";
  const playbookKeys = rule?.playbookKeys ?? [];

  let severity: FailureSeverity = "attention";
  if (signal.urgency === "critical" || options?.essentialService) {
    severity = "critical";
  } else if (signal.urgency === "high") {
    severity = "major";
  } else if (failureClass === "QUALITY_AND_SAFETY") {
    severity = "human_safety_review_required";
  } else if (playbookKeys.includes("family_violence_safe_mode")) {
    severity = "human_safety_review_required";
  } else if (signal.confidence === "low") {
    severity = "informational";
  }

  // Commercial tier must never influence severity — not even present in inputs.
  return {
    failureClass,
    severity,
    describesServiceNotParticipant: true,
    summary: signal.rawSummary,
    verificationStatus:
      signal.confidence === "high" || signal.sourceType === "transport"
        ? "verified"
        : "unverified",
    playbookKeys,
  };
}
