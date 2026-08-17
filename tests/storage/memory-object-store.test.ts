import { describe, expect, it } from "vitest";

import { ObjectNotFoundError } from "@/lib/storage/errors";
import { MemoryObjectStore } from "@/lib/storage/providers/memory-object-store";

describe("MemoryObjectStore", () => {
  it("round-trips put/get/exists/metadata/remove", async () => {
    const store = new MemoryObjectStore();
    const key = "access-evidence/places/place_1/observations/obs_1/original/a.jpg";
    await store.put({
      key,
      bucket: "evidence",
      data: new Uint8Array([1, 2, 3]),
      contentType: "image/jpeg",
    });
    expect(await store.exists({ key, bucket: "evidence" })).toBe(true);
    const meta = await store.getMetadata({ key, bucket: "evidence" });
    expect(meta?.sizeBytes).toBe(3);
    const got = await store.get({ key, bucket: "evidence" });
    expect(Array.from(got.body)).toEqual([1, 2, 3]);
    const signed = await store.createSignedReadUrl({
      key,
      bucket: "evidence",
      expiresInSeconds: 60,
    });
    expect(signed.url).toContain("memory://read/");
    expect(signed.url).not.toMatch(/service.role|service_role/i);
    await store.remove({ key, bucket: "evidence" });
    expect(await store.exists({ key, bucket: "evidence" })).toBe(false);
  });

  it("throws ObjectNotFoundError for missing objects", async () => {
    const store = new MemoryObjectStore();
    await expect(
      store.get({ key: "missing", bucket: "evidence" }),
    ).rejects.toBeInstanceOf(ObjectNotFoundError);
  });
});
