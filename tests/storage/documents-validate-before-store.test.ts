import { mkdir, readdir, rm } from "fs/promises";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/phase2", () => ({
  phase2Config: {
    documentStorageMode: "local",
    documentMaxUploadMb: 1,
  },
}));

import {
  sniffMimeType,
  storeDocumentFile,
  validateUploadBuffer,
} from "@/lib/storage/documents";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "documents");

describe("document upload validate-before-store", () => {
  beforeEach(async () => {
    await mkdir(UPLOAD_ROOT, { recursive: true });
  });

  afterEach(async () => {
    // Clean only files created in this suite (hash-prefixed names we control)
    try {
      const files = await readdir(UPLOAD_ROOT);
      await Promise.all(
        files
          .filter((f) => f.includes("spoof") || f.includes("oversize") || f.includes("ok-plain"))
          .map((f) => rm(path.join(UPLOAD_ROOT, f), { force: true })),
      );
    } catch {
      // ignore
    }
  });

  it("sniffs PDF / PNG / JPEG / plain text from content", () => {
    expect(sniffMimeType(Buffer.from("%PDF-1.4\n"))).toBe("application/pdf");
    expect(
      sniffMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(sniffMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(sniffMimeType(Buffer.from("hello accessible world\n"))).toBe(
      "text/plain",
    );
  });

  it("rejects spoofed extension without writing a file", async () => {
    const before = new Set(await readdir(UPLOAD_ROOT).catch(() => [] as string[]));
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]);
    const { error } = validateUploadBuffer(buffer);
    expect(error).toBe("File type not allowed");

    await expect(
      storeDocumentFile(buffer, "evil.pdf"),
    ).rejects.toThrow(/not allowed/i);

    const after = await readdir(UPLOAD_ROOT).catch(() => [] as string[]);
    expect(after.filter((f) => !before.has(f))).toEqual([]);
  });

  it("rejects oversize uploads without writing a file", async () => {
    const before = new Set(await readdir(UPLOAD_ROOT).catch(() => [] as string[]));
    // 1 MB limit in mock — build ~1.1 MB of plain text
    const buffer = Buffer.alloc(1.1 * 1024 * 1024, 0x61);
    const { error } = validateUploadBuffer(buffer);
    expect(error).toMatch(/under 1 MB/i);

    await expect(
      storeDocumentFile(buffer, "oversize.txt"),
    ).rejects.toThrow(/under 1 MB/i);

    const after = await readdir(UPLOAD_ROOT).catch(() => [] as string[]);
    expect(after.filter((f) => !before.has(f))).toEqual([]);
  });

  it("stores sniffed text/plain even when extension is .bin", async () => {
    const buffer = Buffer.from("plain language summary for NDIS participants\n");
    const stored = await storeDocumentFile(buffer, "ok-plain.bin", "text/plain");
    expect(stored.mimeType).toBe("text/plain");
    expect(stored.fileSize).toBe(buffer.length);
  });
});
