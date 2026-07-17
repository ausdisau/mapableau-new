import { describe, expect, it } from "vitest";

import { evaluateGoLiveDecision } from "@/lib/assurance/go-live/decision-policy";
import { canAutoActivatePilot } from "@/lib/assurance/go-live/pilot-policy";
import { registrationImpliesPlatformApproval } from "@/lib/assurance/registration/registration-decision-service";
import { deriveNdiaAdapterHealth } from "@/lib/integrations/adapters/ndia-adapter";
import { evaluateEvidenceLinkage } from "@/lib/ndia-readiness/evidence-bundle-service";

describe("registration", () => {
  it("registration never equals platform approval", () => {
    expect(registrationImpliesPlatformApproval("approved_externally")).toBe(false);
    expect(registrationImpliesPlatformApproval("ready_to_submit")).toBe(false);
  });
});

describe("go-live", () => {
  it("is not passed by feature flags alone", () => {
    const result = evaluateGoLiveDecision({
      featureFlagsSatisfied: true,
      assuranceDecision: "blocked",
      registrationSatisfied: false,
      ndiaPartnershipSatisfied: false,
      workerTrustSatisfied: false,
      rollbackPlanDocumented: false,
    });
    expect(result.decision).toBe("blocked");
    expect(result.blockingReasons).toContain("feature_flags_do_not_equal_go_live");
  });

  it("never auto-activates pilots", () => {
    expect(canAutoActivatePilot("approved_not_activated")).toBe(false);
    expect(canAutoActivatePilot("active")).toBe(false);
  });
});

describe("NDIA adapter health", () => {
  it("is not healthy from flags alone", () => {
    const derived = deriveNdiaAdapterHealth({
      moduleEnabled: true,
      envEnabled: true,
      profileConfigured: false,
      externallyApproved: false,
      suspended: false,
      realSubmissionBlocked: true,
    });
    expect(derived.status).not.toBe("healthy");
    expect(derived.status).toBe("not_configured");
  });

  it("blocks direct adapter without external approval", () => {
    const derived = deriveNdiaAdapterHealth({
      moduleEnabled: true,
      envEnabled: true,
      profileConfigured: true,
      externallyApproved: false,
      suspended: false,
      realSubmissionBlocked: true,
    });
    expect(derived.status).toBe("blocked");
  });
});

describe("evidence linkage", () => {
  it("rejects unrelated timesheet-only participant scrape patterns", () => {
    const result = evaluateEvidenceLinkage({
      invoiceId: "inv1",
      organisationId: "org1",
      billableItems: [],
    });
    expect(result.linkageStatus).toBe("unsafe");
    expect(result.canSupportApproval).toBe(false);
  });

  it("requires exact evidence package linkage for approval", () => {
    const result = evaluateEvidenceLinkage({
      invoiceId: "inv1",
      organisationId: "org1",
      billableItems: [
        {
          id: "bi1",
          organisationId: "org1",
          timesheetId: "ts1",
          supersededById: null,
          status: "ready",
          evidencePackage: {
            id: "ep1",
            timesheetId: "ts1",
            status: "complete",
            supersededAt: null,
            references: [
              { referenceType: "timesheet", referenceId: "ts1" },
              { referenceType: "attestation", referenceId: "att1" },
            ],
          },
        },
      ],
    });
    expect(result.linkageStatus).toBe("exact_match");
    expect(result.canSupportApproval).toBe(true);
    expect(result.timesheetIds).toEqual(["ts1"]);
  });

  it("marks mismatched timesheet refs as ambiguous and not approvable", () => {
    const result = evaluateEvidenceLinkage({
      invoiceId: "inv1",
      organisationId: "org1",
      billableItems: [
        {
          id: "bi1",
          organisationId: "org1",
          timesheetId: "ts1",
          supersededById: null,
          status: "ready",
          evidencePackage: {
            id: "ep1",
            timesheetId: "ts1",
            status: "complete",
            supersededAt: null,
            references: [{ referenceType: "timesheet", referenceId: "ts_other" }],
          },
        },
      ],
    });
    expect(result.linkageStatus).toBe("ambiguous");
    expect(result.canSupportApproval).toBe(false);
  });
});
