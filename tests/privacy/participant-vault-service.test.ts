import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const prisma = {
    participantVaultItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    document: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    documentAccessGrant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
    fn(prisma),
  );
  return { prisma };
});

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/storage/documents", () => ({
  storeDocumentFile: vi.fn(),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  shareConsentStateForGrantee: vi.fn().mockResolvedValue("none"),
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { shareConsentStateForGrantee } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import {
  addVaultItem,
  attachVaultItemSchema,
  shareVaultItem,
  shareVaultItemSchema,
  revokeVaultShare,
  VaultError,
} from "@/lib/privacy/participant-vault";
import { storeDocumentFile } from "@/lib/storage/documents";

function enableVault() {
  process.env.MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED = "true";
}

function enableDocumentObjectStore() {
  process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
  process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED = "true";
  process.env.DOCUMENT_STORAGE_MODE = "object_store";
}

function futureExpiry(days = 7): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function ownedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "vault_item_1",
    participantId: "user_owner",
    documentId: "doc_1",
    kind: "identity",
    label: "Licence",
    createdById: "user_owner",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    document: {
      id: "doc_1",
      title: "licence.pdf",
      mimeType: "application/pdf",
      fileSize: 1200,
      deletedAt: null,
      uploadedById: "user_owner",
      participantId: "user_owner",
      organisationId: null,
      visibility: "private_to_participant",
      fileKey: "asset:secretassetid",
      storedAssetId: "asset_secret",
    },
    ...overrides,
  };
}

describe("participant information vault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enableVault();
    delete process.env.MAPABLE_OBJECT_STORAGE_ENABLED;
    delete process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED;
    delete process.env.DOCUMENT_STORAGE_MODE;
    vi.mocked(shareConsentStateForGrantee).mockResolvedValue("none");
  });

  afterEach(() => {
    delete process.env.MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED;
    delete process.env.MAPABLE_OBJECT_STORAGE_ENABLED;
    delete process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED;
    delete process.env.DOCUMENT_STORAGE_MODE;
  });

  it("rejects organisation-private documents", async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: "doc_org",
      visibility: "organisation_private",
      organisationId: "org_1",
      uploadedById: "user_owner",
      participantId: "user_owner",
      deletedAt: null,
    } as never);

    await expect(
      addVaultItem({
        userId: "user_owner",
        kind: "plan",
        documentId: "doc_org",
      }),
    ).rejects.toMatchObject({ code: "ORG_PRIVATE_FORBIDDEN", status: 403 });
  });

  it("rejects documents that belong to an organisation even if visibility is private", async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: "doc_org2",
      visibility: "private_to_participant",
      organisationId: "org_1",
      uploadedById: "user_owner",
      participantId: "user_owner",
      deletedAt: null,
    } as never);

    await expect(
      addVaultItem({
        userId: "user_owner",
        kind: "other",
        documentId: "doc_org2",
      }),
    ).rejects.toMatchObject({ code: "ORG_PRIVATE_FORBIDDEN" });
  });

  it("requires the owner to share", async () => {
    vi.mocked(prisma.participantVaultItem.findUnique).mockResolvedValue(
      ownedItem({ participantId: "user_other" }) as never,
    );

    await expect(
      shareVaultItem({
        userId: "user_owner",
        itemId: "vault_item_1",
        granteeUserId: "user_grantee",
        purpose: "Share plan for booking",
        expiresAt: futureExpiry(),
      }),
    ).rejects.toMatchObject({ code: "ITEM_NOT_FOUND", status: 404 });
  });

  it("rejects access_evidence_photo as a vault share purpose", async () => {
    vi.mocked(prisma.participantVaultItem.findUnique).mockResolvedValue(
      ownedItem() as never,
    );

    await expect(
      shareVaultItem({
        userId: "user_owner",
        itemId: "vault_item_1",
        granteeUserId: "user_grantee",
        purpose: "access_evidence_photo",
        expiresAt: futureExpiry(),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN_PURPOSE" });
  });

  it("revokes a share idempotently", async () => {
    vi.mocked(prisma.participantVaultItem.findUnique).mockResolvedValue(
      ownedItem() as never,
    );
    const grant = {
      id: "grant_1",
      documentId: "doc_1",
      userId: "user_grantee",
      createdById: "user_owner",
      purpose: "Share identity for intake",
      expiresAt: futureExpiry(),
      revokedAt: new Date("2026-08-02T00:00:00.000Z"),
      createdAt: new Date(),
    };
    vi.mocked(prisma.documentAccessGrant.findUnique).mockResolvedValue(grant as never);

    const first = await revokeVaultShare("user_owner", "vault_item_1", "grant_1");
    expect(first).toEqual({ ok: true, alreadyRevoked: true });
    expect(prisma.documentAccessGrant.update).not.toHaveBeenCalled();
  });

  it("keeps object keys and service-role material out of vault JSON", async () => {
    vi.mocked(prisma.document.findUnique).mockResolvedValue({
      id: "doc_1",
      visibility: "private_to_participant",
      organisationId: null,
      uploadedById: "user_owner",
      participantId: "user_owner",
      deletedAt: null,
      fileKey: "asset:supersecret",
      storedAssetId: "asset_supersecret",
      title: "licence.pdf",
      mimeType: "application/pdf",
      fileSize: 12,
    } as never);
    vi.mocked(prisma.participantVaultItem.create).mockResolvedValue({
      id: "vault_item_1",
      participantId: "user_owner",
      documentId: "doc_1",
      kind: "identity",
      label: null,
      createdById: "user_owner",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      document: {
        id: "doc_1",
        title: "licence.pdf",
        mimeType: "application/pdf",
        fileSize: 12,
      },
    } as never);

    const item = await addVaultItem({
      userId: "user_owner",
      kind: "identity",
      documentId: "doc_1",
    });
    const json = JSON.stringify(item);
    expect(json).not.toMatch(/fileKey|storedAssetId|service_role|asset:supersecret/i);
    expect(item.documentId).toBe("doc_1");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "vault.item_added" }),
    );
  });

  it("does not upload to local disk when ObjectStore document flags are off", async () => {
    await expect(
      addVaultItem({
        userId: "user_owner",
        kind: "note",
        file: { buffer: Buffer.from("hello"), originalName: "note.txt" },
      }),
    ).rejects.toMatchObject({ code: "UPLOADS_UNAVAILABLE", status: 503 });
    expect(storeDocumentFile).not.toHaveBeenCalled();
  });

  it("stores participant-owned uploads when ObjectStore document flags are on", async () => {
    enableDocumentObjectStore();
    vi.mocked(storeDocumentFile).mockResolvedValue({
      fileKey: "asset:abc123",
      mimeType: "application/pdf",
      fileSize: 16,
      storedAssetId: "asset_abc123",
      scanStatus: "passed",
    });
    vi.mocked(prisma.document.create).mockResolvedValue({
      id: "doc_new",
    } as never);
    vi.mocked(prisma.participantVaultItem.create).mockResolvedValue({
      id: "vault_item_2",
      participantId: "user_owner",
      documentId: "doc_new",
      kind: "plan",
      label: null,
      createdById: "user_owner",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      document: {
        id: "doc_new",
        title: "plan.pdf",
        mimeType: "application/pdf",
        fileSize: 16,
      },
    } as never);

    const item = await addVaultItem({
      userId: "user_owner",
      kind: "plan",
      file: { buffer: Buffer.from("%PDF"), originalName: "plan.pdf" },
    });
    expect(storeDocumentFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      "plan.pdf",
      expect.objectContaining({
        uploadedById: "user_owner",
        participantId: "user_owner",
      }),
    );
    expect(item.documentId).toBe("doc_new");
    expect(JSON.stringify(item)).not.toMatch(/asset:abc123|service_role/);
  });

  it("rejects unknown attach fields so clients cannot send object keys", () => {
    expect(
      attachVaultItemSchema.safeParse({
        kind: "identity",
        documentId: "document1",
        objectKey: "documents/participants/x/y.pdf",
      }).success,
    ).toBe(false);
    expect(
      shareVaultItemSchema.safeParse({
        granteeUserId: "user_grantee",
        purpose: "Share plan for intake",
        expiresAt: futureExpiry().toISOString(),
        bucket: "private",
      }).success,
    ).toBe(false);
  });

  it("is a VaultError when the flag is off", async () => {
    delete process.env.MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED;
    await expect(
      addVaultItem({ userId: "user_owner", kind: "other", documentId: "doc_1" }),
    ).rejects.toBeInstanceOf(VaultError);
  });
});
