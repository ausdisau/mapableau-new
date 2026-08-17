import { describe, expect, it } from "vitest";

import { InvalidObjectKeyError } from "@/lib/storage/errors";
import {
  buildAccessEvidencePhotoKey,
  buildCareDocumentKey,
  validateObjectKey,
} from "@/lib/storage/key-builder";

describe("object key builder", () => {
  it("builds a deterministic access-evidence photo key", () => {
    const key = buildAccessEvidencePhotoKey({
      placeId: "place_abc123",
      observationId: "obs_xyz98765",
      assetId: "asset_111aaa",
      originalFilename: "Ramp Photo.JPEG",
      contentType: "image/jpeg",
    });
    expect(key).toBe(
      "access-evidence/places/place_abc123/observations/obs_xyz98765/original/asset_111aaa.jpg",
    );
  });

  it("rejects path traversal", () => {
    expect(() => validateObjectKey("access-evidence/../secret")).toThrow(
      InvalidObjectKeyError,
    );
    expect(() => validateObjectKey("access-evidence/%2e%2e/secret")).toThrow(
      InvalidObjectKeyError,
    );
  });

  it("rejects absolute paths and empty segments", () => {
    expect(() => validateObjectKey("/bucket/key")).toThrow(InvalidObjectKeyError);
    expect(() => validateObjectKey("access-evidence//photo.jpg")).toThrow(
      InvalidObjectKeyError,
    );
  });

  it("rejects email-like and NDIS-like segments", () => {
    expect(() =>
      buildAccessEvidencePhotoKey({
        placeId: "user@example.com",
        observationId: "obs_xyz98765",
        assetId: "asset_111aaa",
        originalFilename: "a.jpg",
        contentType: "image/jpeg",
      }),
    ).toThrow(InvalidObjectKeyError);

    expect(() =>
      buildAccessEvidencePhotoKey({
        placeId: "place_abc123",
        observationId: "ndis430000000",
        assetId: "asset_111aaa",
        originalFilename: "a.jpg",
        contentType: "image/jpeg",
      }),
    ).toThrow(InvalidObjectKeyError);
  });

  it("allows opaque hex identifiers that contain digit runs", () => {
    const key = buildAccessEvidencePhotoKey({
      placeId: "a1b2c3d4e5f67890",
      observationId: "abcdef0123456789",
      assetId: "0123456789abcdef",
      originalFilename: "a.jpg",
      contentType: "image/jpeg",
    });
    expect(key).toContain("a1b2c3d4e5f67890");
  });

  it("rejects non-opaque identifiers", () => {
    expect(() =>
      buildAccessEvidencePhotoKey({
        placeId: "Jane Smith",
        observationId: "obs_xyz98765",
        assetId: "asset_111aaa",
        originalFilename: "a.jpg",
        contentType: "image/jpeg",
      }),
    ).toThrow(InvalidObjectKeyError);
  });

  it("builds organisation and participant care-document keys", () => {
    expect(
      buildCareDocumentKey({
        organisationId: "org_abc12345",
        assetId: "asset_doc_01",
        originalFilename: "plan.pdf",
        contentType: "application/pdf",
      }),
    ).toBe("documents/organisations/org_abc12345/asset_doc_01.pdf");

    expect(
      buildCareDocumentKey({
        participantId: "user_abc12345",
        assetId: "asset_doc_02",
        originalFilename: "note.txt",
        contentType: "text/plain",
      }),
    ).toBe("documents/participants/user_abc12345/asset_doc_02.txt");
  });

  it("rejects care-document keys without an owner", () => {
    expect(() =>
      buildCareDocumentKey({
        assetId: "asset_doc_03",
        originalFilename: "plan.pdf",
        contentType: "application/pdf",
      }),
    ).toThrow(InvalidObjectKeyError);
  });
});
