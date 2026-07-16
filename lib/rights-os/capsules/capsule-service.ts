import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  generateSecureToken,
  hashSecureToken,
  issueCapabilityLease,
} from "@/lib/rights-os/ledger/ledger-service";

export async function createAccessCapsule(params: {
  subjectUserId: string;
  purposeCode: string;
  disclosedFields: string[];
  recipientOrganisationId?: string;
  presentationMethod?: string;
  expiresInHours?: number;
  policyDecisionId?: string;
  actorUserId: string;
}) {
  const expiresAt = new Date(
    Date.now() + (params.expiresInHours ?? 4) * 3600_000
  );
  const token = generateSecureToken();
  const tokenHash = hashSecureToken(token);

  let leaseId: string | undefined;
  if (params.policyDecisionId) {
    const lease = await issueCapabilityLease({
      subjectUserId: params.subjectUserId,
      policyDecisionId: params.policyDecisionId,
      purposeCode: params.purposeCode,
      permittedFields: params.disclosedFields,
      permittedOperations: ["read", "disclose"],
      requesterActorId: params.actorUserId,
      recipientOrganisationId: params.recipientOrganisationId,
      expiresAt,
      participantApprovalRef: params.actorUserId,
    });
    leaseId = lease.id;
  }

  const capsule = await prisma.accessCapsule.create({
    data: {
      subjectUserId: params.subjectUserId,
      leaseId,
      purposeCode: params.purposeCode,
      status: "issued",
      disclosedClaimsJson: params.disclosedFields.map((f) => ({ field: f })),
      verifierOrganisationId: params.recipientOrganisationId,
      presentationMethod: params.presentationMethod ?? "secure_link",
      secureTokenHash: tokenHash,
      issuedAt: new Date(),
      expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.capsule_issued",
    entityType: "AccessCapsule",
    entityId: capsule.id,
    participantId: params.subjectUserId,
    organisationId: params.recipientOrganisationId,
    metadata: {
      purposeCode: params.purposeCode,
      fieldCount: params.disclosedFields.length,
      presentationMethod: capsule.presentationMethod,
    },
  });

  return { capsule, secureToken: token };
}

export async function verifyCapsule(params: {
  capsuleId: string;
  token: string;
  verifierActorId?: string;
  verifierOrgId?: string;
}) {
  const tokenHash = hashSecureToken(params.token);
  const capsule = await prisma.accessCapsule.findFirst({
    where: {
      OR: [{ id: params.capsuleId }, { secureTokenHash: tokenHash }],
      status: { in: ["issued", "presented"] },
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
  });

  if (!capsule || capsule.secureTokenHash !== tokenHash) {
    await createAuditEvent({
      actorUserId: params.verifierActorId,
      action: "rights.capsule_replay_blocked",
      entityType: "AccessCapsule",
      entityId: params.capsuleId,
      metadata: { reason: "invalid_or_expired" },
    });
    return { valid: false, outcome: "denied" };
  }

  if (capsule.useCount >= capsule.useLimit) {
    return { valid: false, outcome: "use_limit_exceeded" };
  }

  await prisma.accessCapsule.update({
    where: { id: capsule.id },
    data: {
      useCount: { increment: 1 },
      status: "verified",
    },
  });

  const verification = await prisma.capsuleVerification.create({
    data: {
      capsuleId: capsule.id,
      verifierActorId: params.verifierActorId,
      verifierOrgId: params.verifierOrgId,
      outcome: "verified",
      challengePassed: true,
    },
  });

  await createAuditEvent({
    actorUserId: params.verifierActorId,
    action: "rights.capsule_verified",
    entityType: "AccessCapsule",
    entityId: capsule.id,
    participantId: capsule.subjectUserId,
    organisationId: params.verifierOrgId,
  });

  return {
    valid: true,
    outcome: "verified",
    capsule,
    verification,
    disclosedClaims: capsule.disclosedClaimsJson,
  };
}

export async function revokeCapsule(capsuleId: string, actorUserId: string) {
  const capsule = await prisma.accessCapsule.update({
    where: { id: capsuleId },
    data: { status: "revoked", revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "rights.capsule_revoked",
    entityType: "AccessCapsule",
    entityId: capsule.id,
    participantId: capsule.subjectUserId,
  });

  return capsule;
}

export function buildCapsuleSecureLink(capsuleId: string, token: string) {
  const base =
    process.env.MAPABLE_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return `${base}/rights/capsules/verify?capsuleId=${capsuleId}&token=${encodeURIComponent(token)}`;
}

export function buildPrintableCapsuleCard(capsule: {
  id: string;
  purposeCode: string;
  disclosedClaimsJson: unknown;
  expiresAt: Date | null;
}) {
  const claims = Array.isArray(capsule.disclosedClaimsJson)
    ? capsule.disclosedClaimsJson
    : [];
  return {
    title: "MapAble Access Capsule",
    purpose: capsule.purposeCode,
    capsuleId: capsule.id,
    claims,
    expiresAt: capsule.expiresAt?.toISOString(),
    note: "Present this card or call MapAble for telephone verification.",
  };
}
