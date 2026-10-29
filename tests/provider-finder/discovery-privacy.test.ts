import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { workerProfile: { findMany } },
}));

import { applySavedFinderPreference, findFinderDiscoveryMatches } from "@/lib/provider/finder/personalisation/discovery";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { CurrentUser } from "@/lib/auth/current-user";

const fields: AppliedSearchFields = {
  query: "support worker",
  location: "Sydney NSW",
  providerName: "",
  serviceQuery: "personal care",
  accessQuery: "",
  supportType: null,
  accessNeedIds: [],
};
const fakeUser = { id: "u1" } as CurrentUser;

describe("privacy-sensitive provider and worker discovery", () => {
  beforeEach(() => findMany.mockReset());

  it("never calls worker search for a guest", async () => {
    const result = await findFinderDiscoveryMatches({
      user: null, scope: "both", applied: fields,
      providerResults: [], preference: null,
    });
    expect(result.matches).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("requires a worker-owned, consented publication row", async () => {
    findMany.mockResolvedValue([]);
    await findFinderDiscoveryMatches({
      user: fakeUser, scope: "both", applied: fields,
      providerResults: [], preference: null,
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        active: true,
        directoryPublication: { is: { published: true, consentedAt: { not: null } } },
      }),
    }));
  });

  it("never treats a profile as currently screening-cleared", async () => {
    findMany.mockResolvedValue([{
      id: "worker-1",
      displayName: "Consenting Worker",
      profileSummary: "Support worker",
      serviceTypes: ["personal care"],
      serviceRegions: ["Sydney NSW"],
      languages: ["Auslan"],
    }]);
    const result = await findFinderDiscoveryMatches({
      user: fakeUser, scope: "workers", applied: fields,
      providerResults: [],
      preference: { enabled: true, location: "Sydney", supportType: "personal care", language: "Auslan" },
    });
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].caution).toContain("not independently verified");
    expect(JSON.stringify(result.matches)).not.toMatch(/cleared|approved worker|valid clearance/i);
  });

  it("never adopts saved preferences without opt-in", () => {
    const incoming = { location: "", serviceQuery: "" };
    expect(applySavedFinderPreference(incoming, {
      enabled: false, location: "Perth", supportType: "Transport", language: "Auslan",
    })).toEqual(incoming);
    expect(applySavedFinderPreference(incoming, {
      enabled: true, location: "Perth", supportType: "Transport", language: "Auslan",
    })).toEqual({ location: "Perth", serviceQuery: "Transport" });
  });
});
