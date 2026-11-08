/**
 * MapAbleID v0.3 — server-only authorization rules (shadow mode).
 * Accepts a trusted, SERVER-VERIFIED session context, never a JWT or
 * boolean from a browser. Does not perform cryptography, mint tokens,
 * implement OIDC, or grant access to NDIS/health records by itself.
 */

export type MapAbleIdAction =
  | "view_identity"
  | "view_participant_record"
  | "manage_delegation"
  | "change_security"
  | "launch_service";

export type VerifiedSession = Readonly<{
  verifiedByServer: true;
  subjectId: string;
  issuer: string;
  audience: string;
  sessionId: string;
  expiresAtMs: number;
  revoked: boolean;
  proof?: Readonly<{
    subjectId: string;
    sessionId: string;
    verifiedAtMs: number;
    assurance: "phishing_resistant" | "otp" | "password";
  }>;
}>;

export type VerifiedDelegation = Readonly<{
  ownerSubjectId: string;
  delegateSubjectId: string;
  scopes: readonly (
    | "read_care_plan"
    | "read_transport"
    | "read_access_preferences"
  )[];
  expiresAtMs: number;
  revoked: boolean;
}>;

export type VerifiedServiceEntitlement = Readonly<{
  subjectId: string;
  serviceId: string;
  expiresAtMs: number;
  revoked: boolean;
}>;

export type IdentityAccessRequest = Readonly<{
  action: MapAbleIdAction;
  resourceOwnerSubjectId: string;
  serviceId?: string;
  scope?: "read_care_plan" | "read_transport" | "read_access_preferences";
  delegation?: VerifiedDelegation;
  serviceEntitlement?: VerifiedServiceEntitlement;
}>;

export type PolicyConfiguration = Readonly<{
  trustedIssuers: readonly string[];
  audience: string;
  nowMs: number;
}>;

export type IdentityDecision = Readonly<{
  allow: boolean;
  reason:
    | "ALLOW_SELF"
    | "ALLOW_DELEGATED_READ"
    | "ALLOW_SERVICE"
    | "DENY_UNVERIFIED_SESSION"
    | "DENY_UNTRUSTED_ISSUER_OR_AUDIENCE"
    | "DENY_EXPIRED_SESSION"
    | "DENY_INVALID_ACTION"
    | "DENY_NOT_OWNER"
    | "DENY_DELEGATION_SCOPE"
    | "DENY_ENTITLEMENT"
    | "DENY_STEP_UP_REQUIRED";
  requiresHumanFallback: boolean;
}>;

const ACTIONS: readonly string[] = [
  "view_identity",
  "view_participant_record",
  "manage_delegation",
  "change_security",
  "launch_service",
];

const DENY = (
  reason: IdentityDecision["reason"],
  requiresHumanFallback = false,
): IdentityDecision => ({ allow: false, reason, requiresHumanFallback });

const ALLOW = (reason: IdentityDecision["reason"]): IdentityDecision => ({
  allow: true,
  reason,
  requiresHumanFallback: false,
});

const recentPhishingResistantProof = (
  session: VerifiedSession,
  config: PolicyConfiguration,
): boolean => {
  const proof = session.proof;
  if (!proof) return false;
  const age = config.nowMs - proof.verifiedAtMs;
  return (
    proof.subjectId === session.subjectId &&
    proof.sessionId === session.sessionId &&
    proof.assurance === "phishing_resistant" &&
    Number.isFinite(age) &&
    age >= 0 &&
    age <= 5 * 60_000
  );
};

/**
 * Call ONLY after verifying issuer signature, audience, expiration, revocation
 * and account binding in a trusted server boundary. Organisation membership
 * never replaces participant-ownership checks here.
 */
export function decideIdentityAccess(
  session: VerifiedSession | null,
  request: IdentityAccessRequest,
  config: PolicyConfiguration,
): IdentityDecision {
  if (
    !session ||
    session.verifiedByServer !== true ||
    !session.subjectId ||
    !session.sessionId
  ) {
    return DENY("DENY_UNVERIFIED_SESSION");
  }
  if (
    !config.trustedIssuers.includes(session.issuer) ||
    session.audience !== config.audience
  ) {
    return DENY("DENY_UNTRUSTED_ISSUER_OR_AUDIENCE");
  }
  if (
    session.revoked ||
    !Number.isFinite(config.nowMs) ||
    !Number.isFinite(session.expiresAtMs) ||
    session.expiresAtMs <= config.nowMs
  ) {
    return DENY("DENY_EXPIRED_SESSION");
  }
  if (!ACTIONS.includes(request.action)) return DENY("DENY_INVALID_ACTION");

  const isOwner = request.resourceOwnerSubjectId === session.subjectId;
  if (request.action === "view_identity") {
    return isOwner ? ALLOW("ALLOW_SELF") : DENY("DENY_NOT_OWNER");
  }
  if (request.action === "view_participant_record") {
    if (isOwner) return ALLOW("ALLOW_SELF");
    const grant = request.delegation;
    const scope = request.scope;
    if (
      grant &&
      scope &&
      !grant.revoked &&
      grant.expiresAtMs > config.nowMs &&
      grant.ownerSubjectId === request.resourceOwnerSubjectId &&
      grant.delegateSubjectId === session.subjectId &&
      grant.scopes.includes(scope)
    ) {
      return ALLOW("ALLOW_DELEGATED_READ");
    }
    return DENY("DENY_DELEGATION_SCOPE");
  }
  if (request.action === "launch_service") {
    if (!isOwner) return DENY("DENY_NOT_OWNER");
    const e = request.serviceEntitlement;
    return e &&
      request.serviceId &&
      e.serviceId === request.serviceId &&
      e.subjectId === session.subjectId &&
      !e.revoked &&
      e.expiresAtMs > config.nowMs
      ? ALLOW("ALLOW_SERVICE")
      : DENY("DENY_ENTITLEMENT");
  }
  if (!isOwner) return DENY("DENY_NOT_OWNER");
  if (!recentPhishingResistantProof(session, config)) {
    return DENY("DENY_STEP_UP_REQUIRED", true);
  }
  return ALLOW("ALLOW_SELF");
}
