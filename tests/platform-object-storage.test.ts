import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import {
  deleteObject,
  getLocalStorageRoot,
  getObject,
  listPrefix,
  makeContentAddressedKey,
  putObject,
} from "@/lib/storage/platform-object-storage";

describe("platform object storage", () => {
  beforeEach(async () => {
    process.env.PLATFORM_STORAGE_BACKEND = "local";
    await mkdir(getLocalStorageRoot(), { recursive: true });
  });

  afterEach(async () => {
    await rm(getLocalStorageRoot(), { recursive: true, force: true });
  });

  it("stores and reads object", async () => {
    const body = Buffer.from("hello world", "utf8");
    const key = makeContentAddressedKey("quotes", body, "txt");

    const meta = await putObject({ key, body, contentType: "text/plain" });
    expect(meta.key).toBe(key);

    const loaded = await getObject(key);
    expect(loaded.toString("utf8")).toBe("hello world");
  });

  it("lists and deletes objects by key", async () => {
    const key = "quotes/test-delete.txt";
    await putObject({ key, body: Buffer.from("temporary") });

    const listed = await listPrefix("quotes");
    expect(listed.some((item) => item.key === key)).toBe(true);

    await deleteObject(key);
    const listedAfter = await listPrefix("quotes");
    expect(listedAfter.some((item) => item.key === key)).toBe(false);
  });

  it("rejects path traversal keys", async () => {
    await expect(
      putObject({ key: "../escape.txt", body: Buffer.from("bad") }),
    ).rejects.toThrow("Invalid storage key");
  });
});
