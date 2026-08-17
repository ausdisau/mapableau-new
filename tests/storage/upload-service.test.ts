import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessObservationRecord: {
      findUnique: vi.fn(),
    },
    storedAsset: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    storageUploadSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    accessObservationEvidence: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  StorageAuthorizationError,
  StorageGrantExpiredError,
  StorageReplayError,
} from "@/lib/storage/errors";
import { MemoryObjectStore } from "@/lib/storage/providers/memory-object-store";
import {
  authoriseUpload,
  completeUpload,
  createAssetReadUrl,
  deleteStoredAsset,
  getAssetForActor,
} from "@/lib/storage/upload-service";

const actor: CurrentUser = {
  id: "user_contributor_1",
  email: "c@example.com",
  name: "Contributor",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const other: CurrentUser = {
  ...actor,
  id: "user_other_999",
  email: "o@example.com",
};

function jpegBytes(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
}

describe("storage upload service", () => {
  const store = new MemoryObjectStore();

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
    process.env.MAPABLE_STORAGE_EVIDENCE_BUCKET = "mapable-evidence";
    process.env.CLOUD_STORAGE_PROVIDER = "memory";

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
      const callback = fn as (tx: typeof prisma) => Promise<unknown>;
      return callback(prisma);
    });
  });

  it("authorises a signed upload with a server-generated key", async () => {
    vi.mocked(prisma.accessObservationRecord.findUnique).mockResolvedValue({
      id: "obs_xyz98765",
      placeId: "place_abc123",
      observerUserId: actor.id,
      sourceType: "community",
      verificationStatus: "community_reported",
    } as never);
    vi.mocked(prisma.storedAsset.create).mockImplementation((args) => {
      const data = (args as { data: Record<string, unknown> }).data;
      return Promise.resolve({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        sha256: null,
        organisationId: null,
      }) as never;
    });
    vi.mocked(prisma.storageUploadSession.create).mockImplementation((args) => {
      const data = (args as { data: Record<string, unknown> }).data;
      return Promise.resolve({
        id: "session_111aaa22",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        consumedAt: null,
      }) as never;
    });

    const result = await authoriseUpload(
      {
        actor,
        purpose: "access_evidence_photo",
        contentType: "image/jpeg",
        sizeBytes: 4,
        originalFilename: "ramp.jpg",
        placeId: "place_abc123",
        observationId: "obs_xyz98765",
      },
      { store },
    );

    expect(result.grant.uploadUrl).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/service_role|SERVICE_ROLE/);
    expect(result.grant.key).toContain("access-evidence/places/place_abc123/");
    const createData = vi.mocked(prisma.storedAsset.create).mock.calls[0][0]
      .data as { objectKey: string; bucket: string };
    expect(createData.bucket).toBe("mapable-evidence");
    expect(createData.objectKey).not.toContain("ramp.jpg");
  });

  it("rejects attaching to another contributor's observation", async () => {
    vi.mocked(prisma.accessObservationRecord.findUnique).mockResolvedValue({
      id: "obs_xyz98765",
      placeId: "place_abc123",
      observerUserId: "someone_else_1",
      sourceType: "community",
      verificationStatus: "community_reported",
    } as never);

    await expect(
      authoriseUpload(
        {
          actor,
          purpose: "access_evidence_photo",
          contentType: "image/jpeg",
          sizeBytes: 4,
          originalFilename: "ramp.jpg",
          placeId: "place_abc123",
          observationId: "obs_xyz98765",
        },
        { store },
      ),
    ).rejects.toBeInstanceOf(StorageAuthorizationError);
  });

  it("rejects client-supplied organisation paths for this purpose", async () => {
    await expect(
      authoriseUpload(
        {
          actor,
          purpose: "access_evidence_photo",
          contentType: "image/jpeg",
          sizeBytes: 4,
          originalFilename: "ramp.jpg",
          placeId: "place_abc123",
          observationId: "obs_xyz98765",
          organisationId: "org_other_1",
        },
        { store },
      ),
    ).rejects.toThrow(/Organisation-scoped/);
  });

  it("completes an upload once and rejects replay", async () => {
    const asset = {
      id: "asset_111aaa22",
      objectKey:
        "access-evidence/places/place_abc123/observations/obs_xyz98765/original/asset_111aaa22.jpg",
      bucket: "mapable-evidence",
      provider: "memory",
      contentType: "image/jpeg",
      sizeBytes: 4,
      status: "pending",
    };
    await store.put({
      key: asset.objectKey,
      bucket: asset.bucket,
      data: jpegBytes(),
      contentType: "image/jpeg",
    });

    const nonce = "a".repeat(32);
    const { createHash } = await import("node:crypto");
    const nonceHash = createHash("sha256").update(nonce).digest("hex");

    vi.mocked(prisma.storageUploadSession.findUnique).mockResolvedValue({
      id: "session_111aaa22",
      assetId: asset.id,
      purpose: "access_evidence_photo",
      objectKey: asset.objectKey,
      bucket: asset.bucket,
      provider: "memory",
      contentType: "image/jpeg",
      declaredSizeBytes: 4,
      nonceHash,
      status: "pending",
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      actorUserId: actor.id,
      observationId: "obs_xyz98765",
      asset,
    } as never);
    vi.mocked(prisma.storageUploadSession.update).mockResolvedValue({} as never);
    vi.mocked(prisma.storedAsset.update).mockResolvedValue({
      ...asset,
      status: "ready",
      createdAt: new Date(),
      accessClassification: "AUTHENTICATED",
    } as never);
    vi.mocked(prisma.accessObservationEvidence.create).mockResolvedValue(
      {} as never,
    );

    const first = await completeUpload(
      { actor, sessionId: "session_111aaa22", completionNonce: nonce },
      { store },
    );
    expect(first.asset.status).toBe("ready");
    expect(prisma.accessObservationEvidence.create).toHaveBeenCalled();

    vi.mocked(prisma.storageUploadSession.findUnique).mockResolvedValue({
      id: "session_111aaa22",
      actorUserId: actor.id,
      status: "completed",
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      nonceHash,
      asset,
    } as never);

    await expect(
      completeUpload(
        { actor, sessionId: "session_111aaa22", completionNonce: nonce },
        { store },
      ),
    ).rejects.toBeInstanceOf(StorageReplayError);
  });

  it("rejects expired grants", async () => {
    vi.mocked(prisma.storageUploadSession.findUnique).mockResolvedValue({
      id: "session_expired1",
      actorUserId: actor.id,
      status: "pending",
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      nonceHash: "x",
      asset: { id: "asset_1" },
    } as never);
    vi.mocked(prisma.storageUploadSession.update).mockResolvedValue({} as never);

    await expect(
      completeUpload(
        { actor, sessionId: "session_expired1", completionNonce: "nope" },
        { store },
      ),
    ).rejects.toBeInstanceOf(StorageGrantExpiredError);
  });

  it("denies unauthorised reads of pending assets", async () => {
    vi.mocked(prisma.storedAsset.findUnique).mockResolvedValue({
      id: "asset_secret1",
      createdById: actor.id,
      accessClassification: "AUTHENTICATED",
      organisationId: null,
      status: "pending",
      deletedAt: null,
      contentType: "image/jpeg",
      sizeBytes: 4,
      createdAt: new Date(),
    } as never);

    await expect(getAssetForActor("asset_secret1", other)).rejects.toBeInstanceOf(
      StorageAuthorizationError,
    );
  });

  it("issues a signed read for ready authenticated evidence", async () => {
    const objectKey =
      "access-evidence/places/place_abc123/observations/obs_xyz98765/original/asset_111aaa22.jpg";
    await store.put({
      key: objectKey,
      bucket: "mapable-evidence",
      data: jpegBytes(),
      contentType: "image/jpeg",
    });
    vi.mocked(prisma.storedAsset.findUnique).mockResolvedValue({
      id: "asset_111aaa22",
      createdById: actor.id,
      accessClassification: "AUTHENTICATED",
      organisationId: null,
      status: "ready",
      deletedAt: null,
      objectKey,
      bucket: "mapable-evidence",
      contentType: "image/jpeg",
      sizeBytes: 4,
      createdAt: new Date(),
    } as never);

    const signed = await createAssetReadUrl("asset_111aaa22", other, { store });
    expect(signed.url).toContain("memory://read/");
    expect(signed.url).not.toMatch(/service_role/);
  });

  it("denies deletion by another user", async () => {
    vi.mocked(prisma.storedAsset.findUnique).mockResolvedValue({
      id: "asset_111aaa22",
      createdById: actor.id,
      deletedAt: null,
      objectKey: "k",
      bucket: "b",
    } as never);

    await expect(deleteStoredAsset("asset_111aaa22", other, { store })).rejects.toBeInstanceOf(
      StorageAuthorizationError,
    );
  });
});
