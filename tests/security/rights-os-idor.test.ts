import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { GET } from "@/app/api/rights/data-use-requests/[requestId]/route";

const participantA: CurrentUser = {
  id: "participant-a",
  email: "a@test.com",
  name: "Participant A",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const participantB: CurrentUser = {
  ...participantA,
  id: "participant-b",
  email: "b@test.com",
  name: "Participant B",
};

const findFirstMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rightsDataUseRequest: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(),
}));

vi.mock("@/lib/rights-os/config", () => ({
  isRightsOsEnabled: vi.fn(() => true),
}));

describe("RightsOS IDOR guards", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { requireApiSession } = await import("@/lib/api/auth-handler");
    vi.mocked(requireApiSession).mockResolvedValue(participantA);
  });

  it("rejects cross-participant data-use request lookup", async () => {
    findFirstMock.mockResolvedValue({
      id: "req-1",
      requestId: "external-req-1",
      subjectUserId: participantB.id,
      decisions: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ requestId: "external-req-1" }),
    });

    expect(response.status).toBe(403);
  });

  it("allows participant to read their own data-use request", async () => {
    findFirstMock.mockResolvedValue({
      id: "req-1",
      requestId: "external-req-1",
      subjectUserId: participantA.id,
      decisions: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ requestId: "external-req-1" }),
    });

    expect(response.status).toBe(200);
  });
});
