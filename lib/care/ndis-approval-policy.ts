import type { FundingSourceType } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

export type ApprovalGateDecision = {
  isApproved: boolean;
  requiresExternalApproval: boolean;
  eligibleApproverRoles: UserRole[];
  reason: string;
};

const SELF_MANAGED_APPROVERS: UserRole[] = [
  "participant",
  "family_member",
  "support_coordinator",
  "provider_admin",
  "mapable_admin",
];

const PLAN_MANAGED_APPROVERS: UserRole[] = [
  "plan_manager",
  "support_coordinator",
  "mapable_admin",
];

const AGENCY_MANAGED_APPROVERS: UserRole[] = [
  "support_coordinator",
  "mapable_admin",
];

function rolesForFundingType(type: FundingSourceType | null | undefined): UserRole[] {
  if (type === "ndis_plan_managed") return PLAN_MANAGED_APPROVERS;
  if (type === "ndis_agency_managed") return AGENCY_MANAGED_APPROVERS;
  return SELF_MANAGED_APPROVERS;
}

export function evaluateNdisApprovalGate(params: {
  fundingSourceType: FundingSourceType | null | undefined;
  approvals: Array<{ actorRole: string; decision: "approved" | "rejected" | "pending" }>;
}): ApprovalGateDecision {
  const eligibleApproverRoles = rolesForFundingType(params.fundingSourceType);

  const rejected = params.approvals.find((approval) => approval.decision === "rejected");
  if (rejected) {
    return {
      isApproved: false,
      requiresExternalApproval: true,
      eligibleApproverRoles,
      reason: "Approval explicitly rejected",
    };
  }

  const approvedByEligibleRole = params.approvals.some(
    (approval) =>
      approval.decision === "approved" &&
      eligibleApproverRoles.includes(approval.actorRole as UserRole),
  );

  if (approvedByEligibleRole) {
    return {
      isApproved: true,
      requiresExternalApproval: false,
      eligibleApproverRoles,
      reason: "Approval gate satisfied",
    };
  }

  return {
    isApproved: false,
    requiresExternalApproval: true,
    eligibleApproverRoles,
    reason: "Awaiting eligible approver decision",
  };
}
