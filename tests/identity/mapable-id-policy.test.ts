import { describe, expect, it } from "vitest";

import {
  decideIdentityAccess,
  type IdentityAccessRequest,
  type VerifiedSession,
} from "@/lib/identity/mapable-id-policy";

const now = Date.parse("2026-11-08T10:00:00Z");
const cfg = {
  trustedIssuers: ["https://issuer.example.test"],
  audience: "mapable-id",
  nowMs: now,
};
const session: VerifiedSession = {
  verifiedByServer: true,
  subjectId: "subject-a",
  issuer: "https://issuer.example.test",
  audience: "mapable-id",
  sessionId: "session-a",
  expiresAtMs: now + 3_600_000,
  revoked: false,
};

function req(
  action: IdentityAccessRequest["action"],
  resourceOwnerSubjectId = "subject-a",
  extras: Partial<IdentityAccessRequest> = {},
): IdentityAccessRequest {
  return { action, resourceOwnerSubjectId, ...extras };
}

describe("mapable-id-policy", () => {
  it("denies signed-out and unverified contexts", () => {
    expect(decideIdentityAccess(null, req("view_identity"), cfg).allow).toBe(
      false,
    );
    expect(
      decideIdentityAccess(
        { ...session, verifiedByServer: false } as unknown as VerifiedSession,
        req("view_identity"),
        cfg,
      ).allow,
    ).toBe(false);
  });

  it("fails closed on untrusted issuer or audience", () => {
    expect(
      decideIdentityAccess(
        { ...session, issuer: "https://evil.test" },
        req("view_identity"),
        cfg,
      ).reason,
    ).toBe("DENY_UNTRUSTED_ISSUER_OR_AUDIENCE");
    expect(
      decideIdentityAccess(
        { ...session, audience: "other" },
        req("view_identity"),
        cfg,
      ).allow,
    ).toBe(false);
  });

  it("denies expired and revoked sessions", () => {
    expect(
      decideIdentityAccess(
        { ...session, revoked: true },
        req("view_identity"),
        cfg,
      ).allow,
    ).toBe(false);
    expect(
      decideIdentityAccess(
        { ...session, expiresAtMs: now },
        req("view_identity"),
        cfg,
      ).allow,
    ).toBe(false);
  });

  it("allows owner to view own identity without organisation membership", () => {
    expect(decideIdentityAccess(session, req("view_identity"), cfg).allow).toBe(
      true,
    );
    expect(
      decideIdentityAccess(session, req("view_identity", "subject-b"), cfg)
        .allow,
    ).toBe(false);
  });

  it("limits delegates to exact scope, owner, grantee and expiry", () => {
    const grant = {
      ownerSubjectId: "subject-b",
      delegateSubjectId: "subject-a",
      scopes: ["read_transport"] as const,
      expiresAtMs: now + 60_000,
      revoked: false,
    };
    expect(
      decideIdentityAccess(
        session,
        req("view_participant_record", "subject-b", {
          scope: "read_transport",
          delegation: grant,
        }),
        cfg,
      ).reason,
    ).toBe("ALLOW_DELEGATED_READ");
    expect(
      decideIdentityAccess(
        session,
        req("view_participant_record", "subject-b", {
          scope: "read_care_plan",
          delegation: grant,
        }),
        cfg,
      ).allow,
    ).toBe(false);
    expect(
      decideIdentityAccess(
        session,
        req("view_participant_record", "subject-b", {
          scope: "read_transport",
          delegation: { ...grant, revoked: true },
        }),
        cfg,
      ).allow,
    ).toBe(false);
  });

  it("never lets a delegate change owner security", () => {
    expect(
      decideIdentityAccess(session, req("change_security", "subject-b"), cfg)
        .allow,
    ).toBe(false);
    expect(
      decideIdentityAccess(session, req("manage_delegation", "subject-b"), cfg)
        .allow,
    ).toBe(false);
  });

  it("requires fresh phishing-resistant proof for high-impact changes", () => {
    expect(
      decideIdentityAccess(session, req("change_security"), cfg).reason,
    ).toBe("DENY_STEP_UP_REQUIRED");
    const proof = {
      subjectId: "subject-a",
      sessionId: "session-a",
      verifiedAtMs: now - 60_000,
      assurance: "phishing_resistant" as const,
    };
    expect(
      decideIdentityAccess(
        { ...session, proof },
        req("change_security"),
        cfg,
      ).allow,
    ).toBe(true);
    expect(
      decideIdentityAccess(
        { ...session, proof: { ...proof, assurance: "otp" } },
        req("change_security"),
        cfg,
      ).allow,
    ).toBe(false);
  });

  it("requires exact active service entitlement to launch a service", () => {
    const entitlement = {
      subjectId: "subject-a",
      serviceId: "accessibooks",
      expiresAtMs: now + 60_000,
      revoked: false,
    };
    expect(
      decideIdentityAccess(
        session,
        req("launch_service", "subject-a", {
          serviceId: "accessibooks",
          serviceEntitlement: entitlement,
        }),
        cfg,
      ).reason,
    ).toBe("ALLOW_SERVICE");
    expect(
      decideIdentityAccess(
        session,
        req("launch_service", "subject-a", {
          serviceId: "mapable",
          serviceEntitlement: entitlement,
        }),
        cfg,
      ).allow,
    ).toBe(false);
  });
});
