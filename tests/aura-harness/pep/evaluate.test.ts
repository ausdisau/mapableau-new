import { describe, expect, it, vi } from "vitest";

import {
  createSyntheticPepAdapters,
  evaluateAccessPolicy,
  PEP_POLICY_VERSION,
  type PepAccessRequest,
  type PepAdapters,
} from "@/lib/aura-harness/pep";

const baseRequest = (): PepAccessRequest => ({
  actorUserId: "user-participant",
  participantId: "user-participant",
  tenantId: "org-tenant-1",
  resource: "participant.profile",
  action: "read",
  purpose: "virtual_persona.care_support",
  consentScope: "profile.read",
  permittedFields: ["displayName", "goals"],
  correlationId: "corr-1",
  silent: true,
  now: new Date("2026-11-06T00:00:00.000Z"),
});

function allowConsentAdapters(
  overrides: Partial<PepAdapters> = {},
): PepAdapters {
  return createSyntheticPepAdapters({
    verifyPurposeConsent: async () => ({
      ok: true,
      consentRecordId: "consent-1",
      viaDelegation: false,
    }),
    ...overrides,
  });
}

describe("evaluateAccessPolicy", () => {
  it("denies when PEP flag is off", async () => {
    const adapters = createSyntheticPepAdapters({
      isPepEnabled: () => false,
    });
    const decision = await evaluateAccessPolicy(baseRequest(), adapters);
    expect(decision).toMatchObject({
      allowed: false,
      reason: "pep_disabled",
      policyVersion: PEP_POLICY_VERSION,
    });
  });

  it("allows own-record access with purpose consent", async () => {
    const decision = await evaluateAccessPolicy(
      baseRequest(),
      allowConsentAdapters(),
    );
    expect(decision).toMatchObject({
      allowed: true,
      viaDelegation: false,
      consentRecordId: "consent-1",
      policyVersion: PEP_POLICY_VERSION,
      correlationId: "corr-1",
    });
  });

  it("denies Stop AURA", async () => {
    const decision = await evaluateAccessPolicy(
      baseRequest(),
      allowConsentAdapters({ isAuraStopped: () => true }),
    );
    expect(decision).toMatchObject({ allowed: false, reason: "stop_aura" });
  });

  it("denies prohibited capability", async () => {
    const decision = await evaluateAccessPolicy(
      { ...baseRequest(), capability: "clinical_diagnosis" },
      allowConsentAdapters({
        isProhibitedUse: (c) => c === "clinical_diagnosis",
      }),
    );
    expect(decision).toMatchObject({
      allowed: false,
      reason: "prohibited_use",
    });
  });

  it("denies missing actor / participant / empty tenant", async () => {
    const adapters = allowConsentAdapters();
    expect(
      await evaluateAccessPolicy(
        { ...baseRequest(), actorUserId: "  " },
        adapters,
      ),
    ).toMatchObject({ reason: "missing_actor" });
    expect(
      await evaluateAccessPolicy(
        { ...baseRequest(), participantId: "" },
        adapters,
      ),
    ).toMatchObject({ reason: "missing_participant" });
    expect(
      await evaluateAccessPolicy({ ...baseRequest(), tenantId: "   " }, adapters),
    ).toMatchObject({ reason: "empty_tenant" });
  });

  it("denies cross-tenant delegate without org membership", async () => {
    const decision = await evaluateAccessPolicy(
      {
        ...baseRequest(),
        actorUserId: "delegate-1",
        participantId: "user-participant",
        tenantId: "org-other",
      },
      allowConsentAdapters({
        getActorOrganisationIds: async () => ["org-tenant-1"],
        hasParticipantAuthority: async () => true,
      }),
    );
    expect(decision).toMatchObject({
      allowed: false,
      reason: "tenant_membership_denied",
    });
  });

  it("denies delegate without authority grant", async () => {
    const decision = await evaluateAccessPolicy(
      {
        ...baseRequest(),
        actorUserId: "delegate-1",
        participantId: "user-participant",
        delegationDomain: "virtual_persona",
      },
      allowConsentAdapters({
        getActorOrganisationIds: async () => ["org-tenant-1"],
        hasParticipantAuthority: async () => false,
      }),
    );
    expect(decision).toMatchObject({
      allowed: false,
      reason: "delegation_invalid",
    });
  });

  it("allows delegate with membership + authority + consent", async () => {
    const hasAuthority = vi.fn(async () => true);
    const decision = await evaluateAccessPolicy(
      {
        ...baseRequest(),
        actorUserId: "delegate-1",
        participantId: "user-participant",
        delegationDomain: "virtual_persona",
      },
      allowConsentAdapters({
        getActorOrganisationIds: async () => ["org-tenant-1"],
        hasParticipantAuthority: hasAuthority,
        verifyPurposeConsent: async () => ({
          ok: true,
          consentRecordId: "consent-2",
          viaDelegation: true,
        }),
      }),
    );
    expect(decision).toMatchObject({
      allowed: true,
      viaDelegation: true,
      consentRecordId: "consent-2",
    });
    expect(hasAuthority).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "delegate-1",
        participantId: "user-participant",
        domain: "virtual_persona",
        action: "read",
      }),
    );
  });

  it("maps consent denials (revoked, purpose, fields)", async () => {
    for (const reason of [
      "consent_withdrawn",
      "consent_expired",
      "purpose_mismatch",
      "fields_insufficient",
      "consent_missing",
    ] as const) {
      const decision = await evaluateAccessPolicy(
        baseRequest(),
        createSyntheticPepAdapters({
          verifyPurposeConsent: async () => ({ ok: false, reason }),
        }),
      );
      expect(decision).toMatchObject({ allowed: false, reason });
    }
  });

  it("ignores forged client role/tenant/consent claims", async () => {
    const consent = vi.fn(async () => ({
      ok: true as const,
      consentRecordId: "consent-1",
      viaDelegation: false,
    }));
    const decision = await evaluateAccessPolicy(
      {
        ...baseRequest(),
        actorUserId: "attacker",
        participantId: "user-participant",
        tenantId: "org-tenant-1",
        untrustedClientClaims: {
          role: "admin",
          tenantId: "org-tenant-1",
          consentId: "forged-consent",
          permissions: ["*"],
        },
      },
      createSyntheticPepAdapters({
        getActorOrganisationIds: async () => [],
        hasParticipantAuthority: async () => false,
        verifyPurposeConsent: consent,
      }),
    );
    // Forged admin role does not bypass missing membership/authority.
    expect(decision).toMatchObject({
      allowed: false,
      reason: "tenant_membership_denied",
    });
    expect(consent).not.toHaveBeenCalled();
  });

  it("does not expose grant or revoke helpers on adapters surface", async () => {
    const adapters = createSyntheticPepAdapters();
    expect(adapters).not.toHaveProperty("grantPermission");
    expect(adapters).not.toHaveProperty("revokePermission");
    expect(adapters).not.toHaveProperty("applyPolicyDiff");
  });
});
