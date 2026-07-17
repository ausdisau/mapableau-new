export interface WorkOrderVerificationResult {
  verified: boolean;
  evidenceRef: string | null;
  statusRestored: false;
}

export function verifyWorkOrderCompletion(
  evidenceRef?: string | null,
): WorkOrderVerificationResult {
  return {
    verified: Boolean(evidenceRef),
    evidenceRef: evidenceRef ?? null,
    statusRestored: false,
  };
}
