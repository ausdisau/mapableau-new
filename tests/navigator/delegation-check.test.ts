import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantAuthorityGrant: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { assertDelegatedOrSelfAuthority } from "@/lib/authority/delegation-check";

describe("Delegation authority checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats self as authoritative without a grant", async () => {
    const result = await assertDelegatedOrSelfAuthority({
      participantId: "p1",
      actorUserId: "p1",
      domain: "navigator",
      action: "provider_search",
    });
    expect(result).toEqual({ ok: true, mode: "self" });
  });

  it("rejects invalid or expired delegation", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );

    const result = await assertDelegatedOrSelfAuthority({
      participantId: "p1",
      actorUserId: "supporter-1",
      domain: "navigator",
      action: "provider_search",
      consentScopes: ["navigator.provider_search"],
    });
    expect(result.ok).toBe(false);
    expect(result.mode).toBe("denied");
  });

  it("rejects overbroad field access under scoped grants", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst)
      .mockResolvedValueOnce({
        id: "g1",
        consentScopes: ["navigator.provider_search"],
        allowedFields: ["preferences"],
        actions: ["provider_search"],
      } as never)
      .mockResolvedValueOnce({
        id: "g1",
        consentScopes: ["navigator.provider_search"],
        allowedFields: ["preferences"],
        actions: ["provider_search"],
      } as never);

    // hasParticipantAuthority uses findFirst; field check uses a second findFirst.
    const result = await assertDelegatedOrSelfAuthority({
      participantId: "p1",
      actorUserId: "supporter-1",
      domain: "navigator",
      action: "provider_search",
      consentScopes: ["navigator.provider_search"],
      fields: ["clinical_notes"],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("DELEGATION_FIELD_SCOPE_EXCEEDED");
  });
});
