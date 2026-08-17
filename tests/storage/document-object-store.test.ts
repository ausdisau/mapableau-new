import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    storedAsset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    organisationMember: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { storeCareDocumentOnObjectStore } from "@/lib/storage/document-object-store";
import { storeDocumentFile } from "@/lib/storage/documents";
import {
  MalwareDetectedError,
  MalwareScanRequiredError,
  StorageAuthorizationError,
} from "@/lib/storage/errors";
import { resetObjectStoreCache } from "@/lib/storage/factory";
import { EICAR_TEST_SIGNATURE } from "@/lib/storage/malware-scanner";
import { MemoryObjectStore } from "@/lib/storage/providers/memory-object-store";

function pdfBytes(): Buffer {
  return Buffer.from("%PDF-1.4\n% test\n");
}

function enableDocumentObjectStore() {
  process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
  process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED = "true";
  process.env.DOCUMENT_STORAGE_MODE = "object_store";
  process.env.CLOUD_STORAGE_PROVIDER = "memory";
  process.env.MAPABLE_STORAGE_PRIVATE_BUCKET = "mapable-private";
  process.env.MAPABLE_ENVIRONMENT = "test";
}

describe("care document ObjectStore writer", () => {
  const store = new MemoryObjectStore();

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    resetObjectStoreCache();
    enableDocumentObjectStore();
    delete process.env.MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN;
    delete process.env.MAPABLE_MALWARE_SCAN_URL;
    vi.mocked(prisma.storedAsset.create).mockResolvedValue({
      id: "asset_test123456",
      organisationId: null,
      provider: "memory",
      bucket: "mapable-private",
      objectKey: "documents/participants/user_participant1/asset_test123456.pdf",
      originalFilename: "plan.pdf",
      contentType: "application/pdf",
      sizeBytes: 16,
      sha256: null,
      accessClassification: "PARTICIPANT_CONTROLLED",
      sourceType: "care_document",
      createdById: "user_uploader1",
      retentionClass: "standard",
      status: "ready",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
  });

  afterEach(() => {
    resetObjectStoreCache();
    delete process.env.MAPABLE_OBJECT_STORAGE_ENABLED;
    delete process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED;
    delete process.env.DOCUMENT_STORAGE_MODE;
    delete process.env.CLOUD_STORAGE_PROVIDER;
    delete process.env.MAPABLE_STORAGE_PRIVATE_BUCKET;
    delete process.env.MAPABLE_ENVIRONMENT;
    delete process.env.MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN;
  });

  it("stores a participant-controlled PDF via ObjectStore", async () => {
    const result = await storeCareDocumentOnObjectStore(
      {
        buffer: pdfBytes(),
        originalName: "plan.pdf",
        uploadedById: "user_uploader1",
        participantId: "user_participant1",
      },
      { store },
    );
    expect(result.fileKey.startsWith("asset:")).toBe(true);
    expect(result.mimeType).toBe("application/pdf");
    expect(result.scanStatus).toBe("not_configured");
    expect(prisma.storedAsset.create).toHaveBeenCalled();
    const created = vi.mocked(prisma.storedAsset.create).mock.calls[0][0];
    expect(created.data.objectKey).toMatch(
      /^documents\/participants\/user_participant1\//,
    );
    expect(created.data.accessClassification).toBe("PARTICIPANT_CONTROLLED");
    expect(await store.exists({
      bucket: "mapable-private",
      key: created.data.objectKey,
    })).toBe(true);
  });

  it("denies client-supplied organisation IDs without membership", async () => {
    vi.mocked(prisma.organisationMember.findFirst).mockResolvedValue(null);
    await expect(
      storeCareDocumentOnObjectStore(
        {
          buffer: pdfBytes(),
          originalName: "plan.pdf",
          uploadedById: "user_uploader1",
          organisationId: "org_notamember",
          organisationIdFromClient: true,
        },
        { store },
      ),
    ).rejects.toBeInstanceOf(StorageAuthorizationError);
  });

  it("rejects EICAR even when a remote scanner is not configured", async () => {
    await expect(
      storeCareDocumentOnObjectStore(
        {
          buffer: Buffer.from(EICAR_TEST_SIGNATURE),
          originalName: "note.txt",
          uploadedById: "user_uploader1",
          participantId: "user_participant1",
        },
        { store },
      ),
    ).rejects.toBeInstanceOf(MalwareDetectedError);
  });

  it("fail-closes ObjectStore writes when malware scanning is required", async () => {
    process.env.MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN = "true";
    await expect(
      storeCareDocumentOnObjectStore(
        {
          buffer: pdfBytes(),
          originalName: "plan.pdf",
          uploadedById: "user_uploader1",
          participantId: "user_participant1",
        },
        { store },
      ),
    ).rejects.toBeInstanceOf(MalwareScanRequiredError);
  });

  it("keeps local disk as the default writer", async () => {
    delete process.env.MAPABLE_OBJECT_STORAGE_ENABLED;
    delete process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED;
    delete process.env.DOCUMENT_STORAGE_MODE;
    const stored = await storeDocumentFile(pdfBytes(), "plan.pdf");
    expect(stored.fileKey.startsWith("asset:")).toBe(false);
    expect(stored.mimeType).toBe("application/pdf");
  });

  it("does not use ObjectStore when only DOCUMENT_STORAGE_MODE is set", async () => {
    delete process.env.MAPABLE_OBJECT_STORAGE_ENABLED;
    delete process.env.MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED;
    process.env.DOCUMENT_STORAGE_MODE = "object_store";
    await expect(storeDocumentFile(pdfBytes(), "plan.pdf")).rejects.toThrow(
      /Only local document storage/,
    );
  });
});
