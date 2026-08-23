/**
 * Alexa adapter types — account linking and request authentication boundary.
 */

import type { AlexaHomeScope } from "./account-linking-config";

export type AlexaExternalProvider = "AMAZON_ALEXA";

export type ExternalAccountLinkStatus =
  | "LINKED"
  | "REVOKED"
  | "PENDING"
  | "ERROR";

export type AlexaAccessTokenClaims = {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat?: number;
  scope?: string;
  /** Must never be trusted as MapAble userId. */
  userId?: string;
  ["https://mapable.com.au/user_id"]?: string;
};

export type ValidatedAlexaIdentity = {
  provider: AlexaExternalProvider;
  issuer: string;
  audience: string;
  externalSubject: string;
  externalSubjectHash: string;
  scopes: string[];
  expiresAt: Date;
};

export type AlexaLinkStatusResponse = {
  provider: AlexaExternalProvider;
  linked: boolean;
  status: ExternalAccountLinkStatus | "NOT_LINKED";
  linkedAt?: string;
  lastVerifiedAt?: string;
  revokedAt?: string;
  grantsHomeAuthority: false;
  claimState: "IMPLEMENTED_NOT_VERIFIED";
  realDeviceControl: "NOT_IMPLEMENTED";
};

export type AlexaClaimValidationFailure =
  | "MISSING_CLAIMS"
  | "WRONG_ISSUER"
  | "WRONG_AUDIENCE"
  | "EXPIRED"
  | "MISSING_SUBJECT"
  | "MISSING_SCOPE"
  | "UNTRUSTED_USER_ID_CLAIM";

export type AlexaClaimValidationResult =
  | { ok: true; identity: ValidatedAlexaIdentity }
  | { ok: false; reason: AlexaClaimValidationFailure };

export type AlexaHomeScopeName = AlexaHomeScope;
