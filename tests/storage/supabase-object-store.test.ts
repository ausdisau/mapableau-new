import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = {
  upload: vi.fn(),
  download: vi.fn(),
  remove: vi.fn(),
  createSignedUrl: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  list: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: () => fromMock,
    },
  }),
}));

import { StorageProviderError } from "@/lib/storage/errors";
import { SupabaseObjectStore } from "@/lib/storage/providers/supabase-object-store";

describe("SupabaseObjectStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps signed upload to a provider-neutral grant without leaking secrets", async () => {
    fromMock.createSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: "https://example.supabase.co/storage/v1/object/upload/sign/evidence/a.jpg",
        token: "upload-token",
        path: "a.jpg",
      },
      error: null,
    });
    const store = new SupabaseObjectStore();
    const grant = await store.createSignedUpload({
      key: "a.jpg",
      bucket: "evidence",
      contentType: "image/jpeg",
      expiresInSeconds: 60,
    });
    expect(grant.provider).toBe("supabase");
    expect(grant.uploadUrl).toContain("https://");
    expect(JSON.stringify(grant)).not.toMatch(/service_role|SERVICE_ROLE/);
  });

  it("maps provider failures without echoing secrets", async () => {
    fromMock.upload.mockResolvedValue({
      data: null,
      error: { message: "invalid service_role Bearer abc.def" },
    });
    const store = new SupabaseObjectStore();
    await expect(
      store.put({
        key: "a.jpg",
        bucket: "evidence",
        data: new Uint8Array([1]),
        contentType: "image/jpeg",
      }),
    ).rejects.toBeInstanceOf(StorageProviderError);
    await expect(
      store.put({
        key: "a.jpg",
        bucket: "evidence",
        data: new Uint8Array([1]),
        contentType: "image/jpeg",
      }),
    ).rejects.toThrow(/redacted/i);
  });

  it("returns metadata from list matches", async () => {
    fromMock.list.mockResolvedValue({
      data: [
        {
          name: "a.jpg",
          updated_at: "2026-08-17T00:00:00.000Z",
          metadata: { size: 12, mimetype: "image/jpeg", eTag: "abc" },
        },
      ],
      error: null,
    });
    const store = new SupabaseObjectStore();
    const meta = await store.getMetadata({
      key: "folder/a.jpg",
      bucket: "evidence",
    });
    expect(meta?.sizeBytes).toBe(12);
    expect(meta?.contentType).toBe("image/jpeg");
  });
});
