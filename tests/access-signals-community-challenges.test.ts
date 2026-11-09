import { describe, expect, it } from "vitest";

import { DEMO_ROUTES } from "@/lib/access-signals/demo-data";
import {
  COMMUNITY_CHALLENGES,
  CHALLENGE_SAFETY_RULES,
  assertChallengesAreSafeDemo,
  challengeFieldNotesHref,
  filterCommunityChallenges,
  getCommunityChallenge,
} from "@/lib/access-signals/community-challenges";

describe("MapAble Signal community challenges synthetic slice", () => {
  it("never publishes fictional challenge material", () => {
    expect(assertChallengesAreSafeDemo()).toBe(true);
    expect(COMMUNITY_CHALLENGES).toHaveLength(5);
    expect(COMMUNITY_CHALLENGES.every((c) => c.synthetic && !c.published)).toBe(true);
    expect(DEMO_ROUTES.every((r) => r.synthetic && !r.published)).toBe(true);
  });

  it("provides a remote participation option for every challenge", () => {
    for (const challenge of COMMUNITY_CHALLENGES) {
      expect(challenge.contributionModes).toContain("remote");
      expect(challenge.steps.length).toBeGreaterThan(0);
      expect(challenge.steps.every((step) => step.guidance.length > 0)).toBe(true);
    }
  });

  it("filters by scope and selects known challenges", () => {
    expect(filterCommunityChallenges("all")).toHaveLength(5);
    expect(filterCommunityChallenges("physical").every((c) => c.focus === "physical")).toBe(true);
    expect(filterCommunityChallenges("sensory").every((c) => c.focus === "sensory")).toBe(true);
    expect(getCommunityChallenge("unknown-id")).toBeUndefined();
    expect(getCommunityChallenge(COMMUNITY_CHALLENGES[0].id)).toEqual(COMMUNITY_CHALLENGES[0]);
  });

  it("deep links only into a known synthetic Field Notes route", () => {
    for (const challenge of COMMUNITY_CHALLENGES) {
      const link = challengeFieldNotesHref(challenge);
      const url = new URL(link, "https://example.test");
      expect(url.pathname).toBe("/access-signals/field-notes");
      expect(url.searchParams.get("route")).toBe(challenge.routeId);
      expect(url.searchParams.get("challenge")).toBe(challenge.id);
      expect(DEMO_ROUTES.some((r) => r.id === challenge.routeId)).toBe(true);
    }
  });

  it("includes safety and no-disclosure safeguards", () => {
    expect(CHALLENGE_SAFETY_RULES.join(" ")).toMatch(/No travel/i);
    expect(CHALLENGE_SAFETY_RULES.join(" ")).toMatch(/private/i);
    expect(CHALLENGE_SAFETY_RULES.join(" ")).toMatch(/does not submit/i);
  });
});
