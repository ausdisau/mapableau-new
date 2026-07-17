import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  relFindUnique: vi.fn(),
  dirFindFirst: vi.fn(),
  recordFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supportCoordinatorRelationship: {
      findUnique: mocks.relFindUnique,
    },
    consentDirective: {
      findFirst: mocks.dirFindFirst,
    },
    consentRecord: {
      findFirst: mocks.recordFindFirst,
    },
  },
}));

import {
  evaluateCoordinatorAuthority,
  hasActiveConsentForCoordinator,
} from "@/lib/support-coordinator/consent-gate";

beforeEach(() => {
  mocks.relFindUnique.mockReset();
  mocks.dirFindFirst.mockReset();
  mocks.recordFindFirst.mockReset();
});

describe("evaluateCoordinatorAuthority — relationship != authority", () => {
  it("relationship without consent has no authority", async () => {
    mocks.relFindUnique.mockResolvedValueOnce({ status: "active" });
    mocks.dirFindFirst.mockResolvedValueOnce(null);
    mocks.recordFindFirst.mockResolvedValueOnce(null);
    const result = await evaluateCoordinatorAuthority("p1", "c1");
    expect(result.relationshipActive).toBe(true);
    expect(result.consentPresent).toBe(false);
    expect(result.hasAuthority).toBe(false);
    expect(result.reason).toContain("relationship_is_not_authority");
  });

  it("consent without relationship has no authority", async () => {
    mocks.relFindUnique.mockResolvedValueOnce(null);
    mocks.dirFindFirst.mockResolvedValueOnce({ id: "d1" });
    mocks.recordFindFirst.mockResolvedValueOnce(null);
    const result = await evaluateCoordinatorAuthority("p1", "c1");
    expect(result.hasAuthority).toBe(false);
    expect(result.reason).toBe("relationship_missing_or_inactive");
  });

  it("relationship + directive grants authority", async () => {
    mocks.relFindUnique.mockResolvedValueOnce({ status: "active" });
    mocks.dirFindFirst.mockResolvedValueOnce({ id: "d1" });
    const result = await evaluateCoordinatorAuthority("p1", "c1");
    expect(result.hasAuthority).toBe(true);
    expect(result.consentSource).toBe("directive");
  });

  it("relationship + legacy record grants authority", async () => {
    mocks.relFindUnique.mockResolvedValueOnce({ status: "active" });
    mocks.dirFindFirst.mockResolvedValueOnce(null);
    mocks.recordFindFirst.mockResolvedValueOnce({ id: "r1" });
    const result = await evaluateCoordinatorAuthority("p1", "c1");
    expect(result.hasAuthority).toBe(true);
    expect(result.consentSource).toBe("record");
  });
});

describe("hasActiveConsentForCoordinator (boolean wrapper)", () => {
  it("returns false with no relationship", async () => {
    mocks.relFindUnique.mockResolvedValueOnce(null);
    expect(await hasActiveConsentForCoordinator("p1", "c1")).toBe(false);
  });

  it("returns false with relationship but no consent", async () => {
    mocks.relFindUnique.mockResolvedValueOnce({ status: "active" });
    mocks.dirFindFirst.mockResolvedValueOnce(null);
    mocks.recordFindFirst.mockResolvedValueOnce(null);
    expect(await hasActiveConsentForCoordinator("p1", "c1")).toBe(false);
  });

  it("returns true with relationship + directive", async () => {
    mocks.relFindUnique.mockResolvedValueOnce({ status: "active" });
    mocks.dirFindFirst.mockResolvedValueOnce({ id: "d1" });
    expect(await hasActiveConsentForCoordinator("p1", "c1")).toBe(true);
  });
});
