export type ContractType =
  | "consent_contract"
  | "service_agreement_contract"
  | "compliance_gate"
  | "credential_proof_contract"
  | "attestation_contract"
  | "payment_release_contract";

export type ContractTriggerEvent =
  | "before_profile_share"
  | "before_job_publish"
  | "before_worker_matching"
  | "before_service_start"
  | "after_service_completion"
  | "before_payment_release";

export type ContractDecision = "proceed" | "review_required" | "blocked";

export type ContractRule = {
  field: string;
  operator: "eq" | "neq" | "in" | "exists";
  value?: unknown;
  message: string;
};

export type ContractDefinition = {
  code: string;
  type: ContractType;
  trigger: ContractTriggerEvent;
  rules: ContractRule[];
  requiresAttestation?: boolean;
};

export type ContractRunContext = Record<string, unknown>;

export type ContractEvaluation = {
  contractCode: string;
  decision: ContractDecision;
  findings: { code: string; message: string }[];
};

export type AttestationRecord = {
  actorType: string;
  actorRef: string;
  claimType: string;
  evidenceHash: string;
  timestamp: string;
  verificationStatus: "pending" | "verified" | "rejected";
};
