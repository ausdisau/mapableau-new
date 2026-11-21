/**
 * P01 Policy Enforcement Point contracts.
 * Server-attested inputs only — client headers never create authority.
 */

export const PEP_POLICY_VERSION = "vp-pep.v1" as const;

export type PepDenialReason =
  | "pep_disabled"
  | "stop_aura"
  | "prohibited_use"
  | "missing_actor"
  | "missing_participant"
  | "missing_tenant"
  | "empty_tenant"
  | "tenant_membership_denied"
  | "consent_missing"
  | "consent_expired"
  | "consent_withdrawn"
  | "consent_superseded"
  | "purpose_mismatch"
  | "fields_insufficient"
  | "action_not_permitted"
  | "tenant_mismatch"
  | "delegation_invalid"
  | "adapter_error";

/** Claims that may appear on client requests — never used for allow decisions. */
export type PepUntrustedClientClaims = {
  role?: string;
  tenantId?: string;
  consentId?: string;
  permissions?: string[];
};

export type PepAccessRequest = {
  actorUserId: string;
  participantId: string;
  tenantId: string;
  resource: string;
  action: string;
  purpose: string;
  /** API dotted consent scope (e.g. profile.read). */
  consentScope: string;
  permittedFields?: string[];
  /** When actor ≠ participant, domain for identity authority grant. */
  delegationDomain?: string;
  /** Capability / use key checked against UNIFIED_PROHIBITED_USES. */
  capability?: string;
  correlationId?: string;
  /** Explicitly ignored for authorisation. */
  untrustedClientClaims?: PepUntrustedClientClaims;
  now?: Date;
  /** Skip audit write (tests / shadow). Default false when PEP enabled. */
  silent?: boolean;
};

export type PepAllowDecision = {
  allowed: true;
  policyVersion: typeof PEP_POLICY_VERSION;
  viaDelegation: boolean;
  consentRecordId: string | null;
  correlationId: string | null;
  evaluatedAt: string;
};

export type PepDenyDecision = {
  allowed: false;
  reason: PepDenialReason;
  policyVersion: typeof PEP_POLICY_VERSION;
  correlationId: string | null;
  evaluatedAt: string;
};

export type PepDecision = PepAllowDecision | PepDenyDecision;

export type PepConsentResult =
  | {
      ok: true;
      consentRecordId: string;
      viaDelegation: boolean;
    }
  | {
      ok: false;
      reason: Extract<
        PepDenialReason,
        | "consent_missing"
        | "consent_expired"
        | "consent_withdrawn"
        | "consent_superseded"
        | "purpose_mismatch"
        | "fields_insufficient"
        | "action_not_permitted"
        | "tenant_mismatch"
        | "delegation_invalid"
      >;
    };

export type PepAdapters = {
  isPepEnabled: () => boolean;
  isAuraStopped: () => boolean;
  isProhibitedUse: (capability: string) => boolean;
  getActorOrganisationIds: (actorUserId: string) => Promise<string[]>;
  verifyPurposeConsent: (input: {
    tenantId: string;
    participantId: string;
    actorUserId: string;
    scope: string;
    purpose: string;
    permittedFields?: string[];
    action: string;
    delegationDomain?: string;
    now?: Date;
    silent?: boolean;
  }) => Promise<PepConsentResult>;
  hasParticipantAuthority: (input: {
    participantId: string;
    actorUserId: string;
    tenantId?: string;
    domain: string;
    action: string;
    consentScopes?: string[];
    now?: Date;
  }) => Promise<boolean>;
  auditDecision: (input: {
    actorUserId: string;
    participantId: string;
    organisationId: string;
    decision: PepDecision;
    resource: string;
    action: string;
    purpose: string;
  }) => Promise<void>;
};
