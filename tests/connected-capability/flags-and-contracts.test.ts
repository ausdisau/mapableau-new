import { describe, expect, it } from "vitest";

import {
  canTransitionHandoff,
  handoffImpliesOutcome,
  EVIDENCE_CLASSES,
} from "@/lib/connected-capability";
import {
  connectedCapabilityFlags,
  isCommunicationPassportEnabled,
  isCommunicationsEnabled,
} from "@/lib/config/connected-capability-flags";

describe("Connected Capability shared spine", () => {
  it("defaults product flags off", () => {
    expect(isCommunicationsEnabled()).toBe(false);
    expect(isCommunicationPassportEnabled()).toBe(false);
    expect(connectedCapabilityFlags.workforceEnabled).toBe(false);
    expect(connectedCapabilityFlags.academyEnabled).toBe(false);
    expect(connectedCapabilityFlags.companionEnabled).toBe(false);
    expect(connectedCapabilityFlags.outcomesEnabled).toBe(false);
    expect(connectedCapabilityFlags.providerOpsEnabled).toBe(false);
    expect(connectedCapabilityFlags.regionalCapacityEnabled).toBe(false);
    expect(connectedCapabilityFlags.developerPlatformEnabled).toBe(false);
  });

  it("keeps permanent denies false", () => {
    expect(connectedCapabilityFlags.autoWorkerAssignmentEnabled).toBe(false);
    expect(connectedCapabilityFlags.aiCompetencyCertificationEnabled).toBe(
      false
    );
    expect(connectedCapabilityFlags.aiEquipmentPrescriptionEnabled).toBe(false);
    expect(connectedCapabilityFlags.aiOutcomeDeterminationEnabled).toBe(false);
    expect(connectedCapabilityFlags.regionalAutoCommitEnabled).toBe(false);
    expect(connectedCapabilityFlags.partnerUnrestrictedDataEnabled).toBe(false);
    expect(connectedCapabilityFlags.aiPaymentOrClaimApprovalEnabled).toBe(
      false
    );
    expect(connectedCapabilityFlags.physicalActionsEnabled).toBe(false);
  });

  it("preserves distinct evidence classes", () => {
    expect(EVIDENCE_CLASSES).toContain("course_completion");
    expect(EVIDENCE_CLASSES).toContain("supervisor_observed");
    expect(EVIDENCE_CLASSES).toContain("unknown");
  });

  it("handoff completed does not imply participant outcome", () => {
    expect(handoffImpliesOutcome("completed")).toBe(false);
    expect(canTransitionHandoff("sent", "accepted")).toBe(false);
    expect(canTransitionHandoff("received", "accepted")).toBe(true);
  });
});
