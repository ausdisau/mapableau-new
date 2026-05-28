import { describe, expect, it } from "vitest";

import { evaluateNdisApprovalGate } from "@/lib/care/ndis-approval-policy";

describe("evaluateNdisApprovalGate", () => {
  it("requires plan manager/coordinator/admin for plan-managed funding", () => {
    const pending = evaluateNdisApprovalGate({
      fundingSourceType: "ndis_plan_managed",
      approvals: [{ actorRole: "participant", decision: "approved" }],
    });
    expect(pending.isApproved).toBe(false);
    expect(pending.eligibleApproverRoles).toContain("plan_manager");

    const approved = evaluateNdisApprovalGate({
      fundingSourceType: "ndis_plan_managed",
      approvals: [{ actorRole: "plan_manager", decision: "approved" }],
    });
    expect(approved.isApproved).toBe(true);
  });

  it("allows participant/family approvals for self-managed funding", () => {
    const approved = evaluateNdisApprovalGate({
      fundingSourceType: "ndis_self_managed",
      approvals: [{ actorRole: "participant", decision: "approved" }],
    });
    expect(approved.isApproved).toBe(true);
  });

  it("treats any rejection as not approved", () => {
    const rejected = evaluateNdisApprovalGate({
      fundingSourceType: "ndis_agency_managed",
      approvals: [{ actorRole: "mapable_admin", decision: "rejected" }],
    });
    expect(rejected.isApproved).toBe(false);
    expect(rejected.reason).toContain("rejected");
  });
});
