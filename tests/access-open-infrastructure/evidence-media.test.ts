import { describe, expect, it } from "vitest";

import {
  EvidenceMediaError,
  validateEvidenceUpload,
} from "@/lib/access/evidence-media/store";

describe("evidence media mime rejection", () => {
  it("rejects unsupported MIME types", () => {
    expect(() =>
      validateEvidenceUpload({
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
        contentType: "application/pdf",
      }),
    ).toThrow(EvidenceMediaError);
  });

  it("rejects magic-byte mismatch", () => {
    expect(() =>
      validateEvidenceUpload({
        buffer: Buffer.from([0x00, 0x00, 0x00]),
        contentType: "image/jpeg",
      }),
    ).toThrow(/magic bytes/i);
  });

  it("accepts valid JPEG", () => {
    const mime = validateEvidenceUpload({
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      contentType: "image/jpeg",
    });
    expect(mime).toBe("image/jpeg");
  });
});
