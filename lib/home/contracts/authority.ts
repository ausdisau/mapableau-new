import type { HomeAutonomyLevel, HomeRiskClass } from "./capability";

export type AuthorityRequirement = {
  minimumLevel: HomeAutonomyLevel;
  riskClass: HomeRiskClass;
  requiresConfirmation: boolean;
  explanationRequired: boolean;
  delegatable: boolean;
};

export type DelegatedAuthority = {
  id: string;
  participantId: string;
  delegateId: string;
  displayName: string;
  validFrom: string;
  validUntil: string;
  allowedCapabilityKinds: string[];
  deniedCapabilityKinds: string[];
  purpose: string;
  active: boolean;
};

export type AuthorityDecision =
  | {
      outcome: "ALLOW";
      basis: string;
      autonomyLevel: HomeAutonomyLevel;
    }
  | {
      outcome: "REQUIRE_CONFIRMATION";
      basis: string;
      autonomyLevel: HomeAutonomyLevel;
      confirmationToken: string;
      expiresAt: string;
    }
  | {
      outcome: "DENY";
      basis: string;
      code:
        | "PARTICIPANT_REFUSAL"
        | "INSUFFICIENT_AUTHORITY"
        | "DELEGATION_EXPIRED"
        | "DELEGATION_DENIED"
        | "CONFIRMATION_EXPIRED"
        | "PRIVACY_ZONE_BLOCKED"
        | "VENDOR_PERMISSION_INSUFFICIENT"
        | "SAFETY_CRITICAL_NOT_SUPPORTED"
        | "NOT_SUPPORTED"
        | "REAL_DEVICE_ACTIONS_DISABLED"
        | "FEATURE_DISABLED"
        | "ADAPTER_DISABLED";
    };
