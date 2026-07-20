import { describe, expect, it } from "vitest";

import {
  filterPublishableApproachCandidates,
  listSyntheticCivicApproachCandidates,
  reviewApproachCandidate,
} from "@/lib/spatial/approach-resolver";

describe("Access approach resolver", () => {
  it("lists synthetic civic candidates as inferred only", () => {
    const list = listSyntheticCivicApproachCandidates(
      new Date("2026-07-20T00:00:00.000Z"),
    );
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.every((c) => c.status === "inferred")).toBe(true);
    expect(filterPublishableApproachCandidates(list)).toEqual([]);
  });

  it("participant confirmation can become publishable; inferred cannot", () => {
    const [entrance] = listSyntheticCivicApproachCandidates();
    expect(entrance).toBeTruthy();
    const confirmed = reviewApproachCandidate(entrance!, {
      decision: "confirmed",
      reviewer: "participant-1",
      reviewerRole: "participant",
    });
    expect(confirmed.status).toBe("participant_confirmed");
    expect(filterPublishableApproachCandidates([confirmed])).toHaveLength(1);
  });

  it("blocks public confirmation of private-home approaches", () => {
    const [entrance] = listSyntheticCivicApproachCandidates();
    const privateHome = {
      ...entrance!,
      candidateId: "home.private",
      disclosure: "private" as const,
    };
    const reviewed = reviewApproachCandidate(privateHome, {
      decision: "confirmed",
      reviewer: "staff-1",
      reviewerRole: "staff",
    });
    expect(reviewed.status).toBe("rejected");
    expect(filterPublishableApproachCandidates([reviewed])).toEqual([]);
  });
});
