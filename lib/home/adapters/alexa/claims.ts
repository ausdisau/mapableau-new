/**
 * Validate Alexa / Auth0 access-token claims for MapAble Home.
 * Callers supply decoded claims after signature verification in a future skill endpoint.
 */

import { createHash } from "crypto";

import {
  ALEXA_REQUIRED_ACTION_SCOPES,
  getAuth0AlexaConfig,
  normalizeAuth0Issuer,
} from "./account-linking-config";
import type {
  AlexaAccessTokenClaims,
  AlexaClaimValidationResult,
  ValidatedAlexaIdentity,
} from "./types";

export function hashExternalSubject(
  provider: string,
  subject: string,
): string {
  return createHash("sha256")
    .update(`${provider}:${subject}`, "utf8")
    .digest("hex");
}

function parseScopes(scope: string | undefined): string[] {
  if (!scope?.trim()) return [];
  return scope.trim().split(/\s+/).filter(Boolean);
}

function audienceList(aud: string | string[]): string[] {
  return Array.isArray(aud) ? aud : [aud];
}

export type ValidateAlexaClaimsOptions = {
  claims: AlexaAccessTokenClaims | null | undefined;
  nowMs?: number;
  requiredScopes?: readonly string[];
  rejectEmbeddedUserId?: boolean;
};

export function validateAlexaAccessTokenClaims(
  options: ValidateAlexaClaimsOptions,
): AlexaClaimValidationResult {
  const {
    claims,
    nowMs = Date.now(),
    requiredScopes = ALEXA_REQUIRED_ACTION_SCOPES,
    rejectEmbeddedUserId = true,
  } = options;

  if (!claims) {
    return { ok: false, reason: "MISSING_CLAIMS" };
  }

  const config = getAuth0AlexaConfig();
  if (!config) {
    return { ok: false, reason: "MISSING_CLAIMS" };
  }

  let expectedIssuer: string;
  try {
    expectedIssuer = normalizeAuth0Issuer(config.issuer);
  } catch {
    return { ok: false, reason: "WRONG_ISSUER" };
  }

  const actualIssuer = normalizeAuth0Issuer(claims.iss ?? "");
  if (actualIssuer !== expectedIssuer) {
    return { ok: false, reason: "WRONG_ISSUER" };
  }

  if (!audienceList(claims.aud ?? []).includes(config.audience)) {
    return { ok: false, reason: "WRONG_AUDIENCE" };
  }

  if (typeof claims.exp !== "number" || claims.exp * 1000 <= nowMs) {
    return { ok: false, reason: "EXPIRED" };
  }

  if (!claims.sub?.trim()) {
    return { ok: false, reason: "MISSING_SUBJECT" };
  }

  if (rejectEmbeddedUserId) {
    const embedded =
      claims.userId ?? claims["https://mapable.com.au/user_id"];
    if (typeof embedded === "string" && embedded.trim()) {
      return { ok: false, reason: "UNTRUSTED_USER_ID_CLAIM" };
    }
  }

  const scopes = parseScopes(claims.scope);
  for (const required of requiredScopes) {
    if (!scopes.includes(required)) {
      return { ok: false, reason: "MISSING_SCOPE" };
    }
  }

  const subject = claims.sub.trim();
  const identity: ValidatedAlexaIdentity = {
    provider: "AMAZON_ALEXA",
    issuer: actualIssuer,
    audience: config.audience,
    externalSubject: subject,
    externalSubjectHash: hashExternalSubject("AMAZON_ALEXA", subject),
    scopes,
    expiresAt: new Date(claims.exp * 1000),
  };

  return { ok: true, identity };
}
