import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisationMember: { findFirst: vi.fn() },
    documentAccessGrant: { findFirst: vi.fn() },
  },
}));

import { canAccessDocument } from "@/lib/documents/document-service";
import { prisma } from "@/lib/prisma";

describe("canAccessDocument grants", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows an active unexpired grant", async () => {
    vi.mocked(prisma.documentAccessGrant.findFirst).mockResolvedValue({
      id: "grant_1",
    } as never);

    const allowed = await canAccessDocument("user_grantee", "participant", {
      id: "doc_1",
      uploadedById: "user_owner",
      participantId: "user_owner",
      organisationId: null,
      visibility: "private_to_participant",
    });

    expect(allowed).toBe(true);
    expect(prisma.documentAccessGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          documentId: "doc_1",
          userId: "user_grantee",
          revokedAt: null,
        }),
      }),
    );
  });

  it("denies when no grant exists for a private document", async () => {
    vi.mocked(prisma.documentAccessGrant.findFirst).mockResolvedValue(null);

    const allowed = await canAccessDocument("user_stranger", "participant", {
      id: "doc_1",
      uploadedById: "user_owner",
      participantId: "user_owner",
      organisationId: null,
      visibility: "private_to_participant",
    });

    expect(allowed).toBe(false);
  });
});
