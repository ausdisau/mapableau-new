import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALEXA_ACCOUNT_LINKING,
  ALEXA_REQUIRED_ACTION_SCOPES,
  getAuth0AlexaConfig,
  getAlexaAccountLinkingPublicStatus,
  isAlexaAccountLinkingConfigured,
  isAllowedAlexaRedirectUri,
} from "@/lib/home/adapters/alexa/account-linking-config";
import {
  accountLinkGrantsHomeAuthority,
  assertAlexaCannotExecuteDevices,
  evaluateAlexaHomeAuthorityGate,
} from "@/lib/home/adapters/alexa/authorization";
import { validateAlexaAccessTokenClaims } from "@/lib/home/adapters/alexa/claims";
import { adaptAlexaIntentToProposal } from "@/lib/home/adapters/alexa/intent-adapter";
import { AlexaIntentAdapter } from "@/lib/home/adapters/alexa/alexa-adapter";
import { mapableHomeFlags } from "@/lib/config/mapable-home";
import type { AuthorityEvaluatorContext } from "@/lib/home/core/authority-evaluator";
import type { HomeActionRequest } from "@/lib/home/contracts/action";

const FLAG_KEYS = [
  "MAPABLE_HOME_ENV_ENABLED",
  "MAPABLE_HOME_ENV_ALEXA_ENABLED",
  "MAPABLE_HOME_ENV_ALEXA_ACCOUNT_LINKING_ENABLED",
  "MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED",
  "AUTH0_ALEXA_CLIENT_ID",
  "AUTH0_ALEXA_CLIENT_SECRET",
  "AUTH0_ALEXA_ISSUER",
  "AUTH0_ALEXA_AUDIENCE",
] as const;

const AMAZON_URIS = [
  "https://alexa.amazon.co.jp/api/skill/link/M34KSZLLCGM3TX",
  "https://layla.amazon.com/api/skill/link/M34KSZLLCGM3TX",
  "https://pitangui.amazon.com/api/skill/link/M34KSZLLCGM3TX",
] as const;

function setAuth0Env() {
  process.env.AUTH0_ALEXA_CLIENT_ID = "alexa-client-id";
  process.env.AUTH0_ALEXA_CLIENT_SECRET = "alexa-client-secret-value";
  process.env.AUTH0_ALEXA_ISSUER = "https://mapable-test.au.auth0.com/";
  process.env.AUTH0_ALEXA_AUDIENCE = "https://api.mapable.com.au/home";
}

function baseClaims(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: "https://mapable-test.au.auth0.com/",
    aud: "https://api.mapable.com.au/home",
    sub: "auth0|alexa-user-1",
    exp: now + 3600,
    scope: ALEXA_REQUIRED_ACTION_SCOPES.join(" "),
    ...overrides,
  };
}

function baseRequest(
  overrides: Partial<HomeActionRequest> = {},
): HomeActionRequest {
  return {
    id: "req-1",
    correlationId: "corr-1",
    participantId: "user-1",
    actorId: "user-1",
    endpointId: "sim-hall-light",
    capabilityKind: "TURN_ON",
    requestedAt: new Date().toISOString(),
    ...overrides,
  };
}

function baseAuthorityContext(
  overrides: Partial<AuthorityEvaluatorContext> = {},
): AuthorityEvaluatorContext {
  return {
    participantAutonomyCeiling: "H3_CONFIRM",
    preAuthorisedCapabilityKinds: ["TURN_ON", "START_ROUTINE"],
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of FLAG_KEYS) delete process.env[key];
  setAuth0Env();
  process.env.MAPABLE_HOME_ENV_ENABLED = "true";
  process.env.MAPABLE_HOME_ENV_ALEXA_ENABLED = "true";
});

afterEach(() => {
  for (const key of FLAG_KEYS) delete process.env[key];
});

describe("Alexa Amazon redirect URIs", () => {
  it("preserves all three Amazon callback URLs exactly", () => {
    expect([...ALEXA_ACCOUNT_LINKING.redirectUris]).toEqual([...AMAZON_URIS]);
    for (const uri of AMAZON_URIS) {
      expect(isAllowedAlexaRedirectUri(uri)).toBe(true);
    }
  });

  it("rejects an unknown Amazon callback URL", () => {
    expect(
      isAllowedAlexaRedirectUri(
        "https://evil.example/api/skill/link/M34KSZLLCGM3TX",
      ),
    ).toBe(false);
    expect(
      isAllowedAlexaRedirectUri(
        "https://pitangui.amazon.com/api/skill/link/OTHER",
      ),
    ).toBe(false);
  });
});

describe("Alexa Auth0 claims validation", () => {
  it("rejects wrong issuer", () => {
    const result = validateAlexaAccessTokenClaims({
      claims: baseClaims({ iss: "https://attacker.example/" }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("WRONG_ISSUER");
  });

  it("rejects wrong audience", () => {
    const result = validateAlexaAccessTokenClaims({
      claims: baseClaims({ aud: "https://api.evil.example" }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("WRONG_AUDIENCE");
  });

  it("rejects expired tokens", () => {
    const result = validateAlexaAccessTokenClaims({
      claims: baseClaims({ exp: Math.floor(Date.now() / 1000) - 10 }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("EXPIRED");
  });

  it("rejects missing required scope", () => {
    const result = validateAlexaAccessTokenClaims({
      claims: baseClaims({ scope: "openid profile" }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("MISSING_SCOPE");
  });

  it("rejects embedded MapAble userId claims", () => {
    const result = validateAlexaAccessTokenClaims({
      claims: baseClaims({ userId: "attacker-user-id" }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNTRUSTED_USER_ID_CLAIM");
  });
});

describe("Alexa authority isolation", () => {
  it("does not treat account linking as Home authority", () => {
    expect(accountLinkGrantsHomeAuthority()).toBe(false);
  });

  it("rejects body userId even when claims are valid and linked", () => {
    const result = evaluateAlexaHomeAuthorityGate({
      claims: baseClaims(),
      linkedMapAbleUserId: "user-1",
      bodyUserId: "attacker-user-id",
      actionRequest: baseRequest(),
      authorityContext: baseAuthorityContext(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("BODY_USER_ID_REJECTED");
  });

  it("does not grant Home authority from OAuth success alone", () => {
    const result = evaluateAlexaHomeAuthorityGate({
      claims: baseClaims(),
      linkedMapAbleUserId: "user-1",
      actionRequest: baseRequest({
        // H3_CONFIRM ceiling without confirmation token → requires confirmation
      }),
      authorityContext: baseAuthorityContext({
        participantAutonomyCeiling: "H3_CONFIRM",
        preAuthorisedCapabilityKinds: [],
      }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect([
        "AUTHORITY_REQUIRES_CONFIRMATION",
        "AUTHORITY_DENIED",
      ]).toContain(result.code);
    }
  });

  it("keeps SAFETY_CRITICAL actions NOT_SUPPORTED", () => {
    const result = evaluateAlexaHomeAuthorityGate({
      claims: baseClaims(),
      linkedMapAbleUserId: "user-1",
      actionRequest: baseRequest({
        capabilityKind: "WHEELCHAIR_PROPULSION" as HomeActionRequest["capabilityKind"],
      }),
      authorityContext: baseAuthorityContext(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect([
        "SAFETY_CRITICAL_NOT_SUPPORTED",
        "AUTHORITY_DENIED",
      ]).toContain(result.code);
    }
  });

  it("does not allow Alexa adapter execute as a device path", async () => {
    const gate = assertAlexaCannotExecuteDevices();
    expect(gate.allowed).toBe(false);
    const adapter = new AlexaIntentAdapter();
    const receipt = await adapter.execute({
      id: "auth-1",
      requestId: "req-1",
      correlationId: "corr-1",
      participantId: "user-1",
      actorId: "user-1",
      endpointId: "sim-hall-light",
      capabilityKind: "TURN_ON",
      riskClass: "LOW",
      authorityBasis: "test",
      authorizedAt: new Date().toISOString(),
      adapterId: adapter.id,
    });
    expect(receipt.result).toBe("NOT_SUPPORTED");
  });

  it("maps going-to-bed utterance to a proposal, not device execute", () => {
    process.env.MAPABLE_HOME_ENV_ALEXA_ENABLED = "true";
    const claims = validateAlexaAccessTokenClaims({ claims: baseClaims() });
    expect(claims.ok).toBe(true);
    if (!claims.ok) return;
    const adapted = adaptAlexaIntentToProposal({
      identity: claims.identity,
      mapAbleUserId: "user-1",
      intentName: "MapAble.StartGoingToBed",
    });
    expect(adapted).not.toBeNull();
    expect(adapted?.proposal.proposedCapabilityKind).toBe("START_ROUTINE");
    expect(adapted?.proposal.proposedRoutineId).toBe("GOING_TO_BED");
  });
});

describe("Alexa secrets and flags", () => {
  it("never returns secrets through public status", () => {
    const status = getAlexaAccountLinkingPublicStatus();
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("alexa-client-secret-value");
    expect(status).not.toHaveProperty("clientSecret");
    expect(status).not.toHaveProperty("accessToken");
    expect(status).not.toHaveProperty("refreshToken");
    expect(status.clientSecretConfigured).toBe(true);
    expect(isAlexaAccountLinkingConfigured()).toBe(true);
    expect(getAuth0AlexaConfig()?.hasClientSecret).toBe(true);
  });

  it("defaults Alexa linking and real-device flags OFF", () => {
    delete process.env.MAPABLE_HOME_ENV_ALEXA_ACCOUNT_LINKING_ENABLED;
    delete process.env.MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED;
    delete process.env.MAPABLE_HOME_ENV_ALEXA_ENABLED;
    delete process.env.MAPABLE_HOME_ENV_ENABLED;
    expect(mapableHomeFlags.enabled).toBe(false);
    expect(mapableHomeFlags.alexaEnabled).toBe(false);
    expect(mapableHomeFlags.alexaAccountLinkingEnabled).toBe(false);
    expect(mapableHomeFlags.realDeviceActionsEnabled).toBe(false);
  });
});
