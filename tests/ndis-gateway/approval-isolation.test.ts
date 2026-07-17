import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { safeEqualHex } from "@/lib/crypto/ndis";
import { allowsRegisteredProviderDirectClaim } from "@/lib/ndis-gateway/domain/funding-route";
import {
  evaluateSubmissionApproval,
  pilotApprovalIsNotClaimAuthority,
  type SubmissionApprovalCandidate,
  type SubmissionSnapshotCandidate,
} from "@/lib/ndis-gateway/security/claim-approval-service";

const snapshotA: SubmissionSnapshotCandidate = {
  id: "snap_a",
  organisationId: "org_a",
  payloadHash: "hash_a",
  supersededAt: null,
};

const approvalA: SubmissionApprovalCandidate = {
  id: "appr_a",
  claimSnapshotId: "snap_a",
  organisationId: "org_a",
  decision: "approved",
  payloadHash: "hash_a",
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
};

describe("approval isolation rules", () => {
  it("accepts exact snapshot + org + payload hash match", () => {
    expect(
      evaluateSubmissionApproval({ snapshot: snapshotA, approval: approvalA })
    ).toBe("ok");
  });

  it("rejects approval for a different claim snapshot", () => {
    expect(
      evaluateSubmissionApproval({
        snapshot: snapshotA,
        approval: { ...approvalA, claimSnapshotId: "snap_b" },
      })
    ).toBe("missing");
  });

  it("rejects approval for a different organisation", () => {
    expect(
      evaluateSubmissionApproval({
        snapshot: snapshotA,
        approval: { ...approvalA, organisationId: "org_b" },
      })
    ).toBe("org_mismatch");
  });

  it("rejects approval when claim payload hash changed", () => {
    expect(
      evaluateSubmissionApproval({
        snapshot: { ...snapshotA, payloadHash: "hash_changed" },
        approval: approvalA,
      })
    ).toBe("hash_mismatch");
    expect(safeEqualHex("hash_a", "hash_changed")).toBe(false);
  });

  it("rejects expired, revoked, rejected and superseded approvals", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(
      evaluateSubmissionApproval({
        snapshot: snapshotA,
        approval: {
          ...approvalA,
          expiresAt: new Date("2026-07-16T11:00:00.000Z"),
        },
        now,
      })
    ).toBe("expired");
    expect(
      evaluateSubmissionApproval({
        snapshot: snapshotA,
        approval: { ...approvalA, revokedAt: now },
        now,
      })
    ).toBe("revoked");
    expect(
      evaluateSubmissionApproval({
        snapshot: snapshotA,
        approval: { ...approvalA, decision: "rejected" },
        now,
      })
    ).toBe("not_approved");
    expect(
      evaluateSubmissionApproval({
        snapshot: { ...snapshotA, supersededAt: now },
        approval: approvalA,
        now,
      })
    ).toBe("superseded");
  });

  it("blocks direct-submission approval funding routes", () => {
    expect(allowsRegisteredProviderDirectClaim("ndia_managed")).toBe(true);
    expect(allowsRegisteredProviderDirectClaim("self_managed")).toBe(false);
    expect(allowsRegisteredProviderDirectClaim("plan_managed")).toBe(false);
    expect(allowsRegisteredProviderDirectClaim("private_pay")).toBe(false);
    expect(allowsRegisteredProviderDirectClaim("unknown")).toBe(false);
  });

  it("documents that global pilot approval is never claim authority", () => {
    expect(pilotApprovalIsNotClaimAuthority()).toBe(true);
  });

  it("restricts approve permission by role", () => {
    expect(hasPermission("provider_admin", "provider:ndis:claim:approve")).toBe(
      true
    );
    expect(hasPermission("participant", "provider:ndis:claim:approve")).toBe(
      false
    );
    expect(
      hasPermission("support_worker", "provider:ndis:claim:approve")
    ).toBe(false);
    expect(
      hasPermission("mapable_admin", "admin:ndis:claim:break_glass")
    ).toBe(true);
    expect(
      hasPermission("provider_admin", "admin:ndis:claim:break_glass")
    ).toBe(false);
  });
});
