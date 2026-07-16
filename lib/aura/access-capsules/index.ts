import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import {
  assertCredentialDoesNotCreateConsent,
  createPresentation,
  type CredentialPresentation,
} from "../credentials";

export type AccessCapsule = {
  id: string;
  userId: string;
  recipient: string;
  verifierIdentity: string;
  purpose: string;
  missionId?: string;
  claimsDisclosed: string[];
  claimsOmitted: string[];
  issueTime: string;
  expiry: string;
  oneTime: boolean;
  reusable: boolean;
  revoked: boolean;
  used: boolean;
  verifierChallenge: string;
  auditReceiptId: string;
  presentationId: string;
  createsConsent: false;
  notADisabilityId: true;
};

const capsules = new Map<string, AccessCapsule>();

export function resetAccessCapsuleStore(): void {
  capsules.clear();
}

export function createAccessCapsule(input: {
  userId: string;
  recipient: string;
  verifierIdentity: string;
  purpose: string;
  missionId?: string;
  credentialId: string;
  claimsDisclosed: string[];
  expiresInMinutes?: number;
}): AccessCapsule {
  if (
    !auraFlags.accessCapsulesEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_ACCESS_CAPSULES_DISABLED");
  }

  const forbidden = ["diagnosis", "medical_history", "home_address", "full_passport"];
  for (const f of input.claimsDisclosed) {
    if (forbidden.includes(f)) {
      throw new Error("AURA_CAPSULE_OVER_DISCLOSURE");
    }
  }

  const presentation = createPresentation({
    credentialId: input.credentialId,
    holderUserId: input.userId,
    disclosedClaims: input.claimsDisclosed,
    recipient: input.recipient,
    purpose: input.purpose,
    oneTime: true,
    expiresInMinutes: input.expiresInMinutes ?? 120,
  });
  assertCredentialDoesNotCreateConsent(presentation);

  const capsule: AccessCapsule = {
    id: randomUUID(),
    userId: input.userId,
    recipient: input.recipient,
    verifierIdentity: input.verifierIdentity,
    purpose: input.purpose,
    missionId: input.missionId,
    claimsDisclosed: input.claimsDisclosed,
    claimsOmitted: [
      "diagnosis",
      "medical_history",
      "full_access_passport",
      "home_address",
      "previous_journeys",
      ...presentation.omittedClaims,
    ],
    issueTime: new Date().toISOString(),
    expiry: presentation.expiresAt,
    oneTime: true,
    reusable: false,
    revoked: false,
    used: false,
    verifierChallenge: presentation.verifierChallenge,
    auditReceiptId: randomUUID(),
    presentationId: presentation.id,
    createsConsent: false,
    notADisabilityId: true,
  };
  capsules.set(capsule.id, capsule);
  return capsule;
}

export function revokeAccessCapsule(capsuleId: string, userId: string): AccessCapsule {
  const c = capsules.get(capsuleId);
  if (!c || c.userId !== userId) throw new Error("AURA_CAPSULE_FORBIDDEN");
  const updated = { ...c, revoked: true };
  capsules.set(capsuleId, updated);
  return updated;
}

export function getAccessCapsule(id: string): AccessCapsule | null {
  return capsules.get(id) ?? null;
}

export function listAccessCapsules(userId: string): AccessCapsule[] {
  return [...capsules.values()].filter((c) => c.userId === userId);
}

export type CapsulePreview = {
  recipient: string;
  purpose: string;
  shared: string[];
  omitted: string[];
  expiry: string;
};

export function previewCapsuleDisclosure(capsule: AccessCapsule): CapsulePreview {
  return {
    recipient: capsule.recipient,
    purpose: capsule.purpose,
    shared: capsule.claimsDisclosed,
    omitted: capsule.claimsOmitted,
    expiry: capsule.expiry,
  };
}

export { type CredentialPresentation };
