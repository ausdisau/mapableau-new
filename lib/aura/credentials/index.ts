import { createHash, randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import { assertWave7GateForWave8, setWave7ReleaseGatePassed } from "../world-model/release-gate";

export type CredentialSchemaRecord = {
  id: string;
  schemaId: string;
  version: string;
  name: string;
  claimTypes: string[];
  notADisabilityId: true;
};

export type CredentialIssuer = {
  id: string;
  did: string;
  name: string;
  organisationId?: string;
  trustState: "trusted" | "untrusted" | "suspended";
  publicKeyRef: string;
};

export type VerifiableCredentialRecord = {
  id: string;
  schemaId: string;
  issuerId: string;
  holderUserId: string;
  claims: Record<string, unknown>;
  issuedAt: string;
  expiresAt: string;
  status: "active" | "suspended" | "revoked" | "expired";
  signature: string;
  signatureValid: boolean;
};

export type CredentialPresentation = {
  id: string;
  credentialId: string;
  disclosedClaims: string[];
  omittedClaims: string[];
  recipient: string;
  purpose: string;
  issuedAt: string;
  expiresAt: string;
  oneTime: boolean;
  used: boolean;
  revoked: boolean;
  verifierChallenge: string;
  consentCreated: false;
};

const schemas = new Map<string, CredentialSchemaRecord>();
const issuers = new Map<string, CredentialIssuer>();
const credentials = new Map<string, VerifiableCredentialRecord>();
const presentations = new Map<string, CredentialPresentation>();
const walletDevices = new Map<string, { userId: string; deviceId: string; recoveryMethod: string }>();

export function resetCredentialStore(): void {
  schemas.clear();
  issuers.clear();
  credentials.clear();
  presentations.clear();
  walletDevices.clear();
}

function assertWave8Enabled(): void {
  if (
    !auraFlags.credentialWalletEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_CREDENTIAL_WALLET_DISABLED");
  }
  try {
    assertWave7GateForWave8();
  } catch {
    if (process.env.NODE_ENV === "test") {
      setWave7ReleaseGatePassed(true);
    } else {
      throw new Error("AURA_WAVE7_GATE_NOT_PASSED");
    }
  }
}

export function registerSchema(input: Omit<CredentialSchemaRecord, "id" | "notADisabilityId">): CredentialSchemaRecord {
  assertWave8Enabled();
  const schema: CredentialSchemaRecord = {
    ...input,
    id: randomUUID(),
    notADisabilityId: true,
  };
  schemas.set(schema.id, schema);
  return schema;
}

export function registerIssuer(input: Omit<CredentialIssuer, "id">): CredentialIssuer {
  assertWave8Enabled();
  const issuer: CredentialIssuer = { ...input, id: randomUUID() };
  issuers.set(issuer.id, issuer);
  return issuer;
}

export function issueCredential(input: {
  schemaId: string;
  issuerId: string;
  holderUserId: string;
  claims: Record<string, unknown>;
  expiresAt: string;
}): VerifiableCredentialRecord {
  assertWave8Enabled();
  const issuer = issuers.get(input.issuerId);
  if (!issuer || issuer.trustState !== "trusted") {
    throw new Error("AURA_ISSUER_NOT_TRUSTED");
  }
  const payload = JSON.stringify({
    schemaId: input.schemaId,
    issuerId: input.issuerId,
    claims: input.claims,
    expiresAt: input.expiresAt,
  });
  const signature = createHash("sha256").update(payload + issuer.publicKeyRef).digest("hex");
  const record: VerifiableCredentialRecord = {
    id: randomUUID(),
    schemaId: input.schemaId,
    issuerId: input.issuerId,
    holderUserId: input.holderUserId,
    claims: input.claims,
    issuedAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    status: "active",
    signature,
    signatureValid: true,
  };
  credentials.set(record.id, record);
  return record;
}

export function revokeCredential(credentialId: string): VerifiableCredentialRecord {
  const c = credentials.get(credentialId);
  if (!c) throw new Error("AURA_CREDENTIAL_NOT_FOUND");
  const updated = { ...c, status: "revoked" as const };
  credentials.set(credentialId, updated);
  return updated;
}

export type VerificationResult = {
  valid: boolean;
  reasons: string[];
  signatureValid: boolean;
  issuerTrusted: boolean;
  createsConsent: false;
};

export function verifyCredential(credentialId: string): VerificationResult {
  const c = credentials.get(credentialId);
  if (!c) {
    return {
      valid: false,
      reasons: ["not_found"],
      signatureValid: false,
      issuerTrusted: false,
      createsConsent: false,
    };
  }
  const issuer = issuers.get(c.issuerId);
  const reasons: string[] = [];
  const issuerTrusted = issuer?.trustState === "trusted";
  if (!issuerTrusted) reasons.push("issuer_not_trusted");
  if (!c.signatureValid) reasons.push("signature_invalid");
  if (c.status === "revoked") reasons.push("revoked");
  if (c.status === "suspended") reasons.push("suspended");
  if (Date.parse(c.expiresAt) <= Date.now()) reasons.push("expired");

  return {
    valid: reasons.length === 0,
    reasons,
    signatureValid: c.signatureValid,
    issuerTrusted: Boolean(issuerTrusted),
    createsConsent: false,
  };
}

export function createPresentation(input: {
  credentialId: string;
  holderUserId: string;
  disclosedClaims: string[];
  recipient: string;
  purpose: string;
  oneTime?: boolean;
  expiresInMinutes?: number;
}): CredentialPresentation {
  assertWave8Enabled();
  if (!auraFlags.selectiveDisclosureEnabled && process.env.NODE_ENV !== "test") {
    throw new Error("MAPABLE_AURA_SELECTIVE_DISCLOSURE_DISABLED");
  }
  const c = credentials.get(input.credentialId);
  if (!c || c.holderUserId !== input.holderUserId) {
    throw new Error("AURA_CREDENTIAL_FORBIDDEN");
  }
  const allClaims = Object.keys(c.claims);
  const omitted = allClaims.filter((k) => !input.disclosedClaims.includes(k));
  const presentation: CredentialPresentation = {
    id: randomUUID(),
    credentialId: input.credentialId,
    disclosedClaims: input.disclosedClaims,
    omittedClaims: omitted,
    recipient: input.recipient,
    purpose: input.purpose,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(
      Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000,
    ).toISOString(),
    oneTime: input.oneTime ?? true,
    used: false,
    revoked: false,
    verifierChallenge: randomUUID(),
    consentCreated: false,
  };
  presentations.set(presentation.id, presentation);
  return presentation;
}

export function consumePresentation(input: {
  presentationId: string;
  challenge: string;
  verifierId: string;
}): { accepted: boolean; reasons: string[] } {
  const p = presentations.get(input.presentationId);
  if (!p) return { accepted: false, reasons: ["not_found"] };
  const reasons: string[] = [];
  if (p.revoked) reasons.push("revoked");
  if (p.used && p.oneTime) reasons.push("replay");
  if (p.verifierChallenge !== input.challenge) reasons.push("challenge_mismatch");
  if (Date.parse(p.expiresAt) <= Date.now()) reasons.push("expired");
  const verification = verifyCredential(p.credentialId);
  if (!verification.valid) reasons.push(...verification.reasons);

  if (reasons.length === 0) {
    presentations.set(input.presentationId, { ...p, used: true });
    return { accepted: true, reasons: [] };
  }
  return { accepted: false, reasons };
}

export function registerWalletDevice(input: {
  userId: string;
  deviceId: string;
  recoveryMethod: "passphrase" | "trusted_contact" | "reissue";
}): void {
  walletDevices.set(input.userId, input);
}

export function recoverWallet(userId: string): {
  recovered: boolean;
  nonWalletFallbackAvailable: true;
  method?: string;
} {
  const device = walletDevices.get(userId);
  if (!device) {
    return { recovered: false, nonWalletFallbackAvailable: true };
  }
  return {
    recovered: true,
    nonWalletFallbackAvailable: true,
    method: device.recoveryMethod,
  };
}

/** Credentials never create consent. */
export function assertCredentialDoesNotCreateConsent(
  presentation: CredentialPresentation,
): void {
  if (presentation.consentCreated !== false) {
    throw new Error("AURA_CREDENTIAL_CONSENT_VIOLATION");
  }
}

export {
  evaluateWave8ReleaseGate,
  setWave8ReleaseGatePassed,
  assertWave8GateForWave9,
} from "./release-gate";
