export type ContractType =
  | "consent_contract"
  | "service_agreement_contract"
  | "compliance_gate"
  | "credential_proof_contract"
  | "payment_release_contract"
  | "participant_confirmation_contract";

export type ContractTrigger =
  | "before_booking_confirmed"
  | "before_worker_matching"
  | "before_driver_assignment"
  | "before_service_start"
  | "after_service_completion"
  | "before_invoice_issue"
  | "before_payment_release";

export const CONTRACT_REGISTRY: {
  type: ContractType;
  triggers: ContractTrigger[];
  version: number;
}[] = [
  {
    type: "consent_contract",
    triggers: ["before_booking_confirmed"],
    version: 1,
  },
  {
    type: "compliance_gate",
    triggers: ["before_worker_matching", "before_driver_assignment"],
    version: 1,
  },
  {
    type: "service_agreement_contract",
    triggers: ["before_service_start"],
    version: 1,
  },
  {
    type: "payment_release_contract",
    triggers: ["before_invoice_issue", "before_payment_release"],
    version: 1,
  },
  {
    type: "participant_confirmation_contract",
    triggers: ["after_service_completion"],
    version: 1,
  },
];

export function contractsForTrigger(trigger: ContractTrigger) {
  return CONTRACT_REGISTRY.filter((c) => c.triggers.includes(trigger));
}
