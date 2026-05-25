export type ClaimValidationResult = {
  workflowId: string;
  invoiceId: string;
  warnings: string[];
  blockers: string[];
  participantApprovalRequired: boolean;
  duplicateRisk: boolean;
  status: "drafted" | "blocked";
};

export async function runClaimValidationWorkflow(params: {
  invoiceId: string;
}): Promise<ClaimValidationResult> {
  return {
    workflowId: "claim_validation",
    invoiceId: params.invoiceId,
    warnings: ["Support item alignment should be confirmed by billing staff."],
    blockers: [],
    participantApprovalRequired: true,
    duplicateRisk: false,
    status: "drafted",
  };
}
