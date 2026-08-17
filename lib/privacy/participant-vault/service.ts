import type {
  Document,
  DocumentAccessGrant,
  DocumentCategory,
  ParticipantVaultItem,
  ParticipantVaultItemKind,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isDocumentObjectStoreEnabled } from "@/lib/config/object-storage";
import { shareConsentStateForGrantee } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import { storeDocumentFile } from "@/lib/storage/documents";
import { sanitiseOriginalFilename } from "@/lib/storage/filename";

import {
  FORBIDDEN_SHARE_PURPOSES,
  MAX_SHARE_TTL_DAYS,
  VAULT_AUDIT_ACTIONS,
  VAULT_ITEM_KINDS,
  VaultError,
  type VaultItemKind,
} from "./errors";
import { isParticipantInformationVaultEnabled } from "./flags";
import type { VaultGrantSummary, VaultItemSummary } from "./types";

const MAX_LABEL_LENGTH = 120;
const MIN_PURPOSE_LENGTH = 8;
const MAX_PURPOSE_LENGTH = 500;

export type { VaultGrantSummary, VaultItemSummary };

export type ListVaultItemsResult = {
  items: VaultItemSummary[];
  uploadsAvailable: boolean;
};

export type AddVaultItemInput = {
  userId: string;
  kind: VaultItemKind;
  label?: string | null;
  documentId?: string;
  file?: { buffer: Buffer; originalName: string };
};

export type ShareVaultItemInput = {
  userId: string;
  itemId: string;
  granteeUserId: string;
  purpose: string;
  expiresAt: Date;
};

function assertVaultEnabled(): void {
  if (!isParticipantInformationVaultEnabled()) {
    throw new VaultError(
      "Participant information vault is disabled",
      "VAULT_DISABLED",
      404,
    );
  }
}

function sanitiseLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().slice(0, MAX_LABEL_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

function documentCategoryForKind(kind: ParticipantVaultItemKind): DocumentCategory {
  switch (kind) {
    case "identity":
      return "participant_identity";
    case "plan":
      return "participant_plan";
    case "agreement":
      return "service_agreement";
    case "note":
      return "other";
    case "other":
      return "other";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function parseKind(value: string): ParticipantVaultItemKind {
  if ((VAULT_ITEM_KINDS as readonly string[]).includes(value)) {
    return value as ParticipantVaultItemKind;
  }
  throw new VaultError("Unknown vault item kind", "INVALID_KIND", 400);
}

function toGrantSummary(grant: DocumentAccessGrant): VaultGrantSummary {
  return {
    id: grant.id,
    granteeUserId: grant.userId,
    purpose: grant.purpose,
    expiresAt: grant.expiresAt.toISOString(),
    revokedAt: grant.revokedAt ? grant.revokedAt.toISOString() : null,
  };
}

function toItemSummary(
  item: ParticipantVaultItem & {
    document: Pick<Document, "id" | "title" | "mimeType" | "fileSize">;
    documentGrants: DocumentAccessGrant[];
  },
): VaultItemSummary {
  return {
    id: item.id,
    documentId: item.documentId,
    kind: item.kind,
    label: item.label,
    title: item.document.title,
    mimeType: item.document.mimeType,
    fileSize: item.document.fileSize,
    createdAt: item.createdAt.toISOString(),
    grants: item.documentGrants.map(toGrantSummary),
  };
}

async function requireOwnedItem(userId: string, itemId: string) {
  const item = await prisma.participantVaultItem.findUnique({
    where: { id: itemId },
    include: { document: true },
  });
  if (!item || item.participantId !== userId) {
    throw new VaultError("Vault item not found", "ITEM_NOT_FOUND", 404);
  }
  return item;
}

export async function listVaultItems(userId: string): Promise<ListVaultItemsResult> {
  assertVaultEnabled();
  const items = await prisma.participantVaultItem.findMany({
    where: { participantId: userId },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          mimeType: true,
          fileSize: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const visible = items.filter((item) => item.document.deletedAt === null);
  const documentIds = visible.map((item) => item.documentId);
  const grants = documentIds.length
    ? await prisma.documentAccessGrant.findMany({
        where: { documentId: { in: documentIds }, createdById: userId },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const grantsByDocument = new Map<string, DocumentAccessGrant[]>();
  for (const grant of grants) {
    const list = grantsByDocument.get(grant.documentId) ?? [];
    list.push(grant);
    grantsByDocument.set(grant.documentId, list);
  }

  return {
    uploadsAvailable: isDocumentObjectStoreEnabled(),
    items: visible.map((item) =>
      toItemSummary({
        ...item,
        documentGrants: grantsByDocument.get(item.documentId) ?? [],
      }),
    ),
  };
}

export async function getVaultItem(userId: string, itemId: string): Promise<VaultItemSummary> {
  assertVaultEnabled();
  const item = await requireOwnedItem(userId, itemId);
  if (item.document.deletedAt) {
    throw new VaultError("Vault item not found", "ITEM_NOT_FOUND", 404);
  }
  const grants = await prisma.documentAccessGrant.findMany({
    where: { documentId: item.documentId, createdById: userId },
    orderBy: { createdAt: "desc" },
  });
  return toItemSummary({ ...item, documentGrants: grants });
}

export async function addVaultItem(input: AddVaultItemInput): Promise<VaultItemSummary> {
  assertVaultEnabled();
  const kind = parseKind(input.kind);
  const label = sanitiseLabel(input.label ?? null);

  if (input.documentId && input.file) {
    throw new VaultError(
      "Provide either a file or an existing document, not both",
      "INVALID_INPUT",
      400,
    );
  }

  let documentId: string;

  if (input.documentId) {
    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
    });
    if (!document || document.deletedAt) {
      throw new VaultError("Document not found", "DOCUMENT_NOT_FOUND", 404);
    }
    if (document.visibility === "organisation_private" || document.organisationId) {
      throw new VaultError(
        "Organisation-private documents cannot enter the vault",
        "ORG_PRIVATE_FORBIDDEN",
        403,
      );
    }
    if (document.uploadedById !== input.userId && document.participantId !== input.userId) {
      throw new VaultError(
        "Only the document owner can add it to the vault",
        "NOT_OWNER",
        403,
      );
    }
    if (document.visibility !== "private_to_participant") {
      throw new VaultError(
        "Only participant-private documents can enter the vault",
        "VISIBILITY_FORBIDDEN",
        403,
      );
    }
    documentId = document.id;
  } else if (input.file) {
    if (!isDocumentObjectStoreEnabled()) {
      throw new VaultError(
        "Vault uploads require ObjectStore document storage; listing existing items is still available",
        "UPLOADS_UNAVAILABLE",
        503,
      );
    }
    const stored = await storeDocumentFile(input.file.buffer, input.file.originalName, {
      uploadedById: input.userId,
      participantId: input.userId,
    });
    const document = await prisma.document.create({
      data: {
        title: sanitiseOriginalFilename(input.file.originalName),
        category: documentCategoryForKind(kind),
        fileKey: stored.fileKey,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        scanStatus: stored.scanStatus ?? "not_configured",
        visibility: "private_to_participant",
        uploadedById: input.userId,
        participantId: input.userId,
        storedAssetId: stored.storedAssetId ?? null,
      },
    });
    documentId = document.id;
  } else {
    throw new VaultError(
      "A file or existing documentId is required",
      "INVALID_INPUT",
      400,
    );
  }

  try {
    const item = await prisma.participantVaultItem.create({
      data: {
        participantId: input.userId,
        documentId,
        kind,
        label,
        createdById: input.userId,
      },
      include: {
        document: {
          select: { id: true, title: true, mimeType: true, fileSize: true },
        },
      },
    });
    await createAuditEvent({
      actorUserId: input.userId,
      action: VAULT_AUDIT_ACTIONS.itemAdded,
      entityType: "ParticipantVaultItem",
      entityId: item.id,
      participantId: input.userId,
      metadata: { kind },
    });
    return toItemSummary({ ...item, documentGrants: [] });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      throw new VaultError(
        "That document is already in the vault",
        "ALREADY_IN_VAULT",
        409,
      );
    }
    throw error;
  }
}

export async function removeVaultItem(userId: string, itemId: string): Promise<{ ok: true }> {
  assertVaultEnabled();
  const item = await requireOwnedItem(userId, itemId);
  await prisma.$transaction(async (tx) => {
    await tx.participantVaultItem.delete({ where: { id: item.id } });
    if (
      item.document.uploadedById === userId &&
      item.document.visibility === "private_to_participant" &&
      !item.document.organisationId
    ) {
      await tx.document.update({
        where: { id: item.documentId },
        data: { deletedAt: new Date() },
      });
    }
  });
  await createAuditEvent({
    actorUserId: userId,
    action: VAULT_AUDIT_ACTIONS.itemRemoved,
    entityType: "ParticipantVaultItem",
    entityId: item.id,
    participantId: userId,
    metadata: { kind: item.kind },
  });
  return { ok: true };
}

export async function shareVaultItem(input: ShareVaultItemInput): Promise<VaultGrantSummary> {
  assertVaultEnabled();
  const item = await requireOwnedItem(input.userId, input.itemId);
  if (item.document.deletedAt) {
    throw new VaultError("Vault item not found", "ITEM_NOT_FOUND", 404);
  }
  if (input.granteeUserId === input.userId) {
    throw new VaultError(
      "Cannot share a vault item with yourself",
      "INVALID_GRANTEE",
      400,
    );
  }
  const purpose = input.purpose.trim();
  if (purpose.length < MIN_PURPOSE_LENGTH || purpose.length > MAX_PURPOSE_LENGTH) {
    throw new VaultError(
      "Share purpose must be between 8 and 500 characters",
      "INVALID_PURPOSE",
      400,
    );
  }
  if (FORBIDDEN_SHARE_PURPOSES.has(purpose)) {
    throw new VaultError(
      "That share purpose is not allowed for the vault",
      "FORBIDDEN_PURPOSE",
      400,
    );
  }
  const now = new Date();
  if (!(input.expiresAt instanceof Date) || Number.isNaN(input.expiresAt.getTime()) || input.expiresAt <= now) {
    throw new VaultError("Share expiry must be a future date", "INVALID_EXPIRY", 400);
  }
  const maxExpiry = new Date(now.getTime() + MAX_SHARE_TTL_DAYS * 24 * 60 * 60 * 1000);
  if (input.expiresAt > maxExpiry) {
    throw new VaultError(
      `Share expiry cannot exceed ${MAX_SHARE_TTL_DAYS} days`,
      "INVALID_EXPIRY",
      400,
    );
  }

  const grantee = await prisma.user.findUnique({
    where: { id: input.granteeUserId },
    select: { id: true },
  });
  if (!grantee) {
    throw new VaultError("Grantee user not found", "GRANTEE_NOT_FOUND", 404);
  }

  const consentState = await shareConsentStateForGrantee({
    subjectUserId: input.userId,
    grantedToUserId: input.granteeUserId,
  });
  if (consentState === "inactive") {
    throw new VaultError(
      "An active consent record is required before sharing with this recipient",
      "CONSENT_REQUIRED",
      403,
    );
  }

  const grant = await prisma.documentAccessGrant.create({
    data: {
      documentId: item.documentId,
      userId: input.granteeUserId,
      createdById: input.userId,
      purpose,
      expiresAt: input.expiresAt,
    },
  });
  await createAuditEvent({
    actorUserId: input.userId,
    action: VAULT_AUDIT_ACTIONS.shareGranted,
    entityType: "DocumentAccessGrant",
    entityId: grant.id,
    participantId: input.userId,
    metadata: { itemId: item.id, granteeUserId: input.granteeUserId },
  });
  return toGrantSummary(grant);
}

export async function revokeVaultShare(
  userId: string,
  itemId: string,
  grantId: string,
): Promise<{ ok: true; alreadyRevoked: boolean }> {
  assertVaultEnabled();
  const item = await requireOwnedItem(userId, itemId);
  const grant = await prisma.documentAccessGrant.findUnique({ where: { id: grantId } });
  if (!grant || grant.documentId !== item.documentId || grant.createdById !== userId) {
    throw new VaultError("Share grant not found", "GRANT_NOT_FOUND", 404);
  }
  if (grant.revokedAt) {
    return { ok: true, alreadyRevoked: true };
  }
  await prisma.documentAccessGrant.update({
    where: { id: grant.id },
    data: { revokedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId: userId,
    action: VAULT_AUDIT_ACTIONS.shareRevoked,
    entityType: "DocumentAccessGrant",
    entityId: grant.id,
    participantId: userId,
    metadata: { itemId: item.id },
  });
  return { ok: true, alreadyRevoked: false };
}
