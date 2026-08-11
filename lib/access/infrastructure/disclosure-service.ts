import type { AccessDisclosureRecipientRole } from "@prisma/client";

import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type DisclosurePreview = {
  passportId: string;
  recipientRole: AccessDisclosureRecipientRole;
  purpose: string;
  requestedAttributes: string[];
  permittedAttributes: string[];
  deniedAttributes: string[];
  policyId: string | null;
};

export async function previewDisclosure(params: {
  userId: string;
  recipientRole: AccessDisclosureRecipientRole;
  purpose: string;
  requestedAttributes: string[];
}): Promise<DisclosurePreview | null> {
  const passport = await getPassportForUser(params.userId);
  if (!passport) return null;

  const policy = await prisma.accessDisclosurePolicyRecord.findFirst({
    where: {
      passportId: passport.id,
      recipientRole: params.recipientRole,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { updatedAt: "desc" },
  });

  const allowed = new Set(policy?.allowedAttributes ?? []);
  const permitted = params.requestedAttributes.filter((a) => allowed.has(a));
  const denied = params.requestedAttributes.filter((a) => !allowed.has(a));

  return {
    passportId: passport.id,
    recipientRole: params.recipientRole,
    purpose: params.purpose,
    requestedAttributes: params.requestedAttributes,
    permittedAttributes: permitted,
    deniedAttributes: denied,
    policyId: policy?.id ?? null,
  };
}

export async function confirmDisclosure(params: {
  userId: string;
  recipientRole: AccessDisclosureRecipientRole;
  recipientRef?: string;
  purpose: string;
  attributeKeys: string[];
  policyId?: string | null;
  consentRecordId?: string;
  consentVersion?: string;
}): Promise<{ receiptId: string; attributeKeys: string[] } | null> {
  const preview = await previewDisclosure({
    userId: params.userId,
    recipientRole: params.recipientRole,
    purpose: params.purpose,
    requestedAttributes: params.attributeKeys,
  });
  if (!preview) return null;

  // Only disclose permitted attributes — never leak denied ones.
  const attributeKeys = preview.permittedAttributes;
  const receipt = await prisma.accessDisclosureReceiptRecord.create({
    data: {
      passportId: preview.passportId,
      policyId: params.policyId ?? preview.policyId,
      disclosedByUserId: params.userId,
      recipientRole: params.recipientRole,
      recipientRef: params.recipientRef,
      purpose: params.purpose,
      attributeKeys,
      consentRecordId: params.consentRecordId,
      consentVersion: params.consentVersion,
    },
  });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: preview.passportId,
      eventType: "disclosure_confirmed",
      actorUserId: params.userId,
      entityType: "AccessDisclosureReceipt",
      entityId: receipt.id,
      summary: `Disclosure confirmed to ${params.recipientRole}`,
      metadataJson: {
        attributeCount: attributeKeys.length,
        purpose: params.purpose,
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "ACCESS_DISCLOSURE_CONFIRMED",
    entityType: "AccessDisclosureReceipt",
    entityId: receipt.id,
    participantId: params.userId,
    metadata: {
      recipientRole: params.recipientRole,
      attributeCount: attributeKeys.length,
      purpose: params.purpose,
    },
  });

  return { receiptId: receipt.id, attributeKeys };
}

export async function revokeDisclosure(params: {
  userId: string;
  receiptId: string;
}): Promise<boolean> {
  const passport = await getPassportForUser(params.userId);
  if (!passport) return false;
  const receipt = await prisma.accessDisclosureReceiptRecord.findFirst({
    where: { id: params.receiptId, passportId: passport.id, revokedAt: null },
  });
  if (!receipt) return false;

  await prisma.accessDisclosureReceiptRecord.update({
    where: { id: receipt.id },
    data: { revokedAt: new Date(), revokedByUserId: params.userId },
  });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: passport.id,
      eventType: "disclosure_revoked",
      actorUserId: params.userId,
      entityType: "AccessDisclosureReceipt",
      entityId: receipt.id,
      summary: "Disclosure revoked",
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "ACCESS_DISCLOSURE_REVOKED",
    entityType: "AccessDisclosureReceipt",
    entityId: receipt.id,
    participantId: params.userId,
  });

  return true;
}

export async function upsertDisclosurePolicy(params: {
  userId: string;
  recipientRole: AccessDisclosureRecipientRole;
  purpose: string;
  allowedAttributes: string[];
  expiresAt?: Date | null;
}): Promise<string | null> {
  const passport = await getPassportForUser(params.userId);
  if (!passport) return null;

  // Deactivate prior active policies for same role+purpose.
  await prisma.accessDisclosurePolicyRecord.updateMany({
    where: {
      passportId: passport.id,
      recipientRole: params.recipientRole,
      purpose: params.purpose,
      active: true,
    },
    data: { active: false },
  });

  const policy = await prisma.accessDisclosurePolicyRecord.create({
    data: {
      passportId: passport.id,
      recipientRole: params.recipientRole,
      purpose: params.purpose,
      allowedAttributes: params.allowedAttributes,
      expiresAt: params.expiresAt ?? null,
      active: true,
    },
  });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: passport.id,
      eventType: "disclosure_policy_updated",
      actorUserId: params.userId,
      entityType: "AccessDisclosurePolicy",
      entityId: policy.id,
      summary: `Disclosure policy updated for ${params.recipientRole}`,
      metadataJson: { attributeCount: params.allowedAttributes.length },
    },
  });

  return policy.id;
}
