import type {
  ActionIntent,
  CoordinationDecision,
  CoordinationRun,
  EvidenceReference,
  ParticipantGoal,
} from "@/lib/care-intelligence/types";

export type KernelPhase =
  | "boot"
  | "perceive"
  | "orient"
  | "deliberate"
  | "simulate"
  | "arbitrate"
  | "commit"
  | "completed"
  | "halted";

export type KernelCapabilityClass =
  | "read"
  | "reason"
  | "simulate"
  | "prepare"
  | "audit";

export interface KernelCapability {
  id: string;
  description: string;
  capabilityClass: KernelCapabilityClass;
  sideEffects: false;
  externalNetwork: false;
  persistentWrite: false;
  participantScoped: true;
}

export type KernelInvariantId =
  | "synthetic_data_only"
  | "participant_stop_dominates"
  | "no_execution_capability"
  | "no_external_model_capability"
  | "no_persistent_memory"
  | "policy_separate_from_specialists"
  | "bounded_cycles"
  | "bounded_commitments"
  | "evidence_references_resolve";

export interface KernelInvariantResult {
  id: KernelInvariantId;
  passed: boolean;
  detail: string;
}

export interface KernelGoal {
  id: string;
  statement: string;
  priority: ParticipantGoal["priority"];
  sourceGoalId: string;
  status: "active" | "satisfied" | "blocked";
}

export interface KernelBelief {
  id: string;
  proposition: string;
  confidence: number;
  evidenceIds: string[];
  status: "asserted" | "uncertain" | "rejected";
}

export interface KernelCommitment {
  id: string;
  planId: string;
  kind: ActionIntent["action"];
  state: "awaiting_participant_confirmation";
  executionAllowed: false;
  expiresAt: string;
}

export interface KernelCapabilityInvocation {
  sequence: number;
  capabilityId: string;
  phase: KernelPhase;
  outcome: "completed" | "skipped" | "blocked";
  summary: string;
}

export interface KernelAuditEvent {
  sequence: number;
  occurredAt: string;
  phase: KernelPhase;
  kind:
    | "kernel_started"
    | "boundary_checked"
    | "perception_recorded"
    | "authority_oriented"
    | "specialists_consulted"
    | "counterfactuals_simulated"
    | "policy_arbitrated"
    | "commitments_prepared"
    | "kernel_completed"
    | "kernel_halted";
  summary: string;
  previousHash: string;
  hash: string;
}

export interface KernelMetacognition {
  calibratedConfidence: number;
  evidenceCoverage: number;
  unresolvedUncertainties: string[];
  specialistDisagreement: boolean;
  humanReviewRequired: boolean;
  humanReviewReason: string;
  selfModificationAttempted: false;
}

export interface KernelAuditVerification {
  valid: boolean;
  eventsChecked: number;
  firstInvalidSequence: number | null;
  reason: string;
}

export interface CsiAgiKernelRun {
  kernelRunId: string;
  kernelVersion: string;
  scenarioId: string;
  phase: "completed" | "halted";
  haltReason: string | null;
  cyclesCompleted: number;
  maxCycles: number;
  decision: CoordinationDecision;
  goals: KernelGoal[];
  beliefs: KernelBelief[];
  evidence: EvidenceReference[];
  capabilityRegistry: KernelCapability[];
  capabilityInvocations: KernelCapabilityInvocation[];
  commitments: KernelCommitment[];
  metacognition: KernelMetacognition;
  invariants: KernelInvariantResult[];
  audit: KernelAuditEvent[];
  auditVerification: KernelAuditVerification;
  coordination: CoordinationRun;
  boundaries: {
    syntheticDataOnly: true;
    sideEffectCapabilities: 0;
    externalNetworkCapabilities: 0;
    persistentWriteCapabilities: 0;
    executionAttempts: 0;
    cyclesBounded: true;
    commitmentsBounded: true;
    policySelfModificationAllowed: false;
  };
}
