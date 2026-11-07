import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { fingerprintToolCall } from "@/lib/aura-harness/fingerprint";
import {
  __resetProgrammeAuraStopForTests,
  isProgrammeAuraStopped,
  stopProgrammeAura,
} from "@/lib/programmes/aura/execution-gate";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../docs/ai-platform/acs/fixtures/breakfast-scenario.json",
);

type BreakfastFixture = {
  id: string;
  synthetic: boolean;
  expressedGoal: { independentBreakfast: boolean; inabilityToEat: boolean };
  standingExclusions: string[];
  workerAttendance: string;
  not: {
    confirmedAbsence: boolean;
    medicalEmergency: boolean;
    permissionToContactRelatives: boolean;
    inferredIncapacity: boolean;
  };
  silenceMeans: string;
  communicationAccessFailure: {
    aacDelay: string;
    cameraUnavailable: string;
    dysarthricSpeech: string;
  };
};

type SimulatedGrant = {
  purpose: string;
  status: "active" | "revoked" | "expired";
  expiryDate: Date | null;
  dataScope: string[];
  grantedToOrganisationId: string | null;
  createdAt: Date;
};

type ProtectedCall = {
  purpose: string;
  requestedFields: string[];
  recipientOrganisationId?: string;
  tenantId?: string;
  grantTenantId?: string;
  stopActive?: boolean;
  memoryApprove?: boolean;
  actorIsModelWritingConsent?: boolean;
};

type Outcome = { allowed: boolean; reason?: string };

function currentPolicy(grant: SimulatedGrant, call: ProtectedCall): Outcome {
  if (grant.status !== "active") {
    return { allowed: false, reason: "status" };
  }
  if (grant.expiryDate && grant.expiryDate <= new Date()) {
    return { allowed: false, reason: "expired" };
  }
  if (call.recipientOrganisationId && grant.grantedToOrganisationId) {
    if (call.recipientOrganisationId !== grant.grantedToOrganisationId) {
      return { allowed: false, reason: "recipient_mismatch" };
    }
  }
  return { allowed: true };
}

function stage1Required(grant: SimulatedGrant, call: ProtectedCall): Outcome {
  if (call.actorIsModelWritingConsent) {
    return { allowed: false, reason: "model_cannot_grant" };
  }
  if (call.stopActive) {
    return { allowed: false, reason: "stop_active" };
  }
  if (call.memoryApprove) {
    return { allowed: false, reason: "memory_cannot_approve" };
  }
  if (!call.recipientOrganisationId) {
    return { allowed: false, reason: "recipient_required" };
  }
  if (!call.tenantId || call.tenantId !== call.grantTenantId) {
    return { allowed: false, reason: "tenant_mismatch" };
  }
  if (grant.status === "revoked") {
    return { allowed: false, reason: "consent_withdrawn" };
  }
  if (grant.status === "expired") {
    return { allowed: false, reason: "consent_expired" };
  }
  if (grant.expiryDate && grant.expiryDate <= new Date()) {
    return { allowed: false, reason: "consent_expired" };
  }
  if (grant.purpose !== call.purpose) {
    return { allowed: false, reason: "purpose_mismatch" };
  }
  if (call.requestedFields.length === 0 || grant.dataScope.length === 0) {
    return { allowed: false, reason: "fields_insufficient" };
  }
  const missing = call.requestedFields.filter(
    (field) => !grant.dataScope.includes(field),
  );
  if (missing.length > 0) {
    return { allowed: false, reason: "fields_insufficient" };
  }
  if (grant.grantedToOrganisationId !== call.recipientOrganisationId) {
    return { allowed: false, reason: "recipient_mismatch" };
  }
  return { allowed: true };
}

const matchingGrant: SimulatedGrant = {
  purpose: "roster.lookup",
  status: "active",
  expiryDate: null,
  dataScope: ["rosterStatus"],
  grantedToOrganisationId: "org-acs-0",
  createdAt: new Date("2026-11-01T00:00:00.000Z"),
};

describe("ACS Stage 0 contracts (current vs Stage 1 required)", () => {
  afterEach(() => {
    __resetProgrammeAuraStopForTests();
  });

  it("documents that checkConsent does not take purpose, dataScope, or sourceAction", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../lib/consent/consent-service.ts",
      ),
      "utf8",
    );
    const fn = source.slice(
      source.indexOf("export async function checkConsent"),
      source.indexOf("export async function listConsentsForParticipant"),
    );
    expect(fn).toContain("subjectUserId");
    expect(fn).toContain("scope");
    expect(fn).not.toContain("params.purpose");
    expect(fn).not.toContain("params.dataScope");
    expect(fn).not.toContain("params.sourceAction");
    expect(fn).toContain('status: "active"');
  });

  it("ACS-N-01: purpose mismatch is allowed today and must be denied in Stage 1", () => {
    const call: ProtectedCall = {
      purpose: "family.notify",
      requestedFields: ["rosterStatus"],
      recipientOrganisationId: "org-acs-0",
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
    };
    expect(currentPolicy(matchingGrant, call).allowed).toBe(true);
    expect(stage1Required(matchingGrant, call)).toEqual({
      allowed: false,
      reason: "purpose_mismatch",
    });
  });

  it("ACS-N-05: extra field is allowed today and must be denied in Stage 1", () => {
    const call: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["clinicalNotes"],
      recipientOrganisationId: "org-acs-0",
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
    };
    expect(currentPolicy(matchingGrant, call).allowed).toBe(true);
    expect(stage1Required(matchingGrant, call).reason).toBe(
      "fields_insufficient",
    );
  });

  it("ACS-N-06: empty dataScope is unrestricted today (Navigator) and must deny on protected path", () => {
    const grant = { ...matchingGrant, dataScope: [] };
    const call: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
      recipientOrganisationId: "org-acs-0",
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
    };
    expect(currentPolicy(grant, call).allowed).toBe(true);
    expect(stage1Required(grant, call).reason).toBe("fields_insufficient");
  });

  it("ACS-N-07: omitted recipient is allowed today and must be denied in Stage 1", () => {
    const call: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
    };
    expect(currentPolicy(matchingGrant, call).allowed).toBe(true);
    expect(stage1Required(matchingGrant, call).reason).toBe(
      "recipient_required",
    );
  });

  it("ACS-N-08/09: wrong org omitted-filter allows today; Stage 1 denies tenant and recipient", () => {
    const omittedRecipient: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
    };
    expect(currentPolicy(matchingGrant, omittedRecipient).allowed).toBe(true);

    const crossTenant: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
      recipientOrganisationId: "org-acs-0",
      tenantId: "tenant-other",
      grantTenantId: "tenant-acs-0",
    };
    expect(stage1Required(matchingGrant, crossTenant).reason).toBe(
      "tenant_mismatch",
    );

    const wrongOrg: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
      recipientOrganisationId: "org-other",
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
    };
    expect(stage1Required(matchingGrant, wrongOrg).reason).toBe(
      "recipient_mismatch",
    );
  });

  it("ACS-N-11: programme Stop is process-local only", () => {
    expect(isProgrammeAuraStopped()).toBe(false);
    stopProgrammeAura();
    expect(isProgrammeAuraStopped()).toBe(true);
    __resetProgrammeAuraStopForTests();
    expect(isProgrammeAuraStopped()).toBe(false);
  });

  it("ACS-N-12: Stage 1 must not let AURA memory approve after revoke", () => {
    const call: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
      recipientOrganisationId: "org-acs-0",
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
      memoryApprove: true,
    };
    const revoked = { ...matchingGrant, status: "revoked" as const };
    expect(currentPolicy(revoked, call).allowed).toBe(false);
    expect(stage1Required(revoked, call).reason).toBe("memory_cannot_approve");
  });

  it("ACS-N-12 fingerprint is tool + payload only (no participant or tenant)", () => {
    const a = fingerprintToolCall("contact.backup", { to: "provider-1" });
    const b = fingerprintToolCall("contact.backup", { to: "provider-1" });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("ACS-N-14: Stage 1 denies model-written consent", () => {
    const call: ProtectedCall = {
      purpose: "roster.lookup",
      requestedFields: ["rosterStatus"],
      recipientOrganisationId: "org-acs-0",
      tenantId: "tenant-acs-0",
      grantTenantId: "tenant-acs-0",
      actorIsModelWritingConsent: true,
    };
    expect(stage1Required(matchingGrant, call).reason).toBe(
      "model_cannot_grant",
    );
  });

  it("ACS-N-15/16: breakfast fixture preserves exclusion and does not infer incapacity", () => {
    const fixture = JSON.parse(
      readFileSync(fixturePath, "utf8"),
    ) as BreakfastFixture;
    expect(fixture.synthetic).toBe(true);
    expect(fixture.id).toBe("ACS-N-16");
    expect(fixture.expressedGoal.independentBreakfast).toBe(true);
    expect(fixture.expressedGoal.inabilityToEat).toBe(false);
    expect(fixture.standingExclusions).toContain("contact.family");
    expect(fixture.workerAttendance).toBe("unknown");
    expect(fixture.not.confirmedAbsence).toBe(true);
    expect(fixture.not.permissionToContactRelatives).toBe(true);
    expect(fixture.not.inferredIncapacity).toBe(true);
    expect(fixture.silenceMeans).toBe("not_permission");
    expect(fixture.communicationAccessFailure.aacDelay).toBe("not_consent");
    expect(fixture.communicationAccessFailure.cameraUnavailable).toBe(
      "not_incapacity",
    );
    expect(fixture.communicationAccessFailure.dysarthricSpeech).toBe(
      "not_incapacity",
    );
  });
});
