export interface VendorAssignmentDecision {
  allowed: boolean;
  maintainerEntityId: string | null;
  reason: string;
}

export function assignVendorToWorkOrder(input: {
  maintainerEntityId?: string | null;
  responsibilityVerified: boolean;
}): VendorAssignmentDecision {
  if (!input.maintainerEntityId)
    return {
      allowed: false,
      maintainerEntityId: null,
      reason: "missing_maintainer",
    };
  if (!input.responsibilityVerified)
    return {
      allowed: false,
      maintainerEntityId: null,
      reason: "responsibility_not_verified",
    };
  return {
    allowed: true,
    maintainerEntityId: input.maintainerEntityId,
    reason: "verified_responsibility",
  };
}
