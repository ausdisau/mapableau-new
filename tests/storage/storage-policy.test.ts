import { afterEach, describe, expect, it } from "vitest";

import { StoragePolicyError } from "@/lib/storage/errors";
import {
  assertClassificationAllowedForPurpose,
  assertMimeAndSize,
  resolvePurposePolicy,
} from "@/lib/storage/policies";

describe("storage policies", () => {
  afterEach(() => {
    delete process.env.MAPABLE_STORAGE_EVIDENCE_MAX_MB;
  });

  it("allows JPEG PNG WebP within size for access evidence photos", () => {
    const policy = resolvePurposePolicy("access_evidence_photo");
    expect(policy.classification).toBe("AUTHENTICATED");
    expect(policy.allowedMimeTypes).toContain("image/jpeg");
    assertMimeAndSize({
      purpose: "access_evidence_photo",
      contentType: "image/png",
      sizeBytes: 1024,
    });
  });

  it("rejects disallowed MIME and oversized files", () => {
    expect(() =>
      assertMimeAndSize({
        purpose: "access_evidence_photo",
        contentType: "application/pdf",
        sizeBytes: 100,
      }),
    ).toThrow(StoragePolicyError);

    process.env.MAPABLE_STORAGE_EVIDENCE_MAX_MB = "1";
    expect(() =>
      assertMimeAndSize({
        purpose: "access_evidence_photo",
        contentType: "image/jpeg",
        sizeBytes: 2 * 1024 * 1024,
      }),
    ).toThrow(/under 1 MB/);
  });

  it("rejects participant-controlled classification for access evidence", () => {
    expect(() =>
      assertClassificationAllowedForPurpose(
        "access_evidence_photo",
        "PARTICIPANT_CONTROLLED",
      ),
    ).toThrow(/Participant-controlled/);
  });

  it("allows participant-controlled or organisation-private for care documents", () => {
    expect(() =>
      assertClassificationAllowedForPurpose(
        "care_document",
        "PARTICIPANT_CONTROLLED",
      ),
    ).not.toThrow();
    expect(() =>
      assertClassificationAllowedForPurpose(
        "care_document",
        "ORGANISATION_PRIVATE",
      ),
    ).not.toThrow();
    expect(() =>
      assertClassificationAllowedForPurpose("care_document", "PUBLIC"),
    ).toThrow(StoragePolicyError);
  });

  it("allows PDF for care documents and rejects it for access evidence", () => {
    assertMimeAndSize({
      purpose: "care_document",
      contentType: "application/pdf",
      sizeBytes: 2048,
    });
    expect(() =>
      assertMimeAndSize({
        purpose: "access_evidence_photo",
        contentType: "application/pdf",
        sizeBytes: 100,
      }),
    ).toThrow(StoragePolicyError);
  });

  it("allows PUBLIC or AUTHENTICATED for community photos", () => {
    expect(() =>
      assertClassificationAllowedForPurpose("access_evidence_photo", "PUBLIC"),
    ).not.toThrow();
    expect(() =>
      assertClassificationAllowedForPurpose(
        "access_evidence_photo",
        "AUTHENTICATED",
      ),
    ).not.toThrow();
  });
});
