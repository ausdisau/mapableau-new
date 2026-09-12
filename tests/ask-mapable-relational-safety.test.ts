import { describe, expect, it } from "vitest";

import {
  addConnectionSupportActions,
  buildConnectionSupportNote,
  containsProhibitedRelationalOutput,
  enforceRelationalOutputBoundary,
  explicitlyRequestsConnectionSupport,
  RELATIONAL_BOUNDARY_MESSAGE,
} from "@/lib/ask-mapable";

describe("MapAble Companion relational safety", () => {
  it("responds only to explicit connection needs rather than inferring loneliness", () => {
    expect(explicitlyRequestsConnectionSupport("I feel lonely tonight")).toBe(true);
    expect(explicitlyRequestsConnectionSupport("I need someone to talk to")).toBe(true);
    expect(explicitlyRequestsConnectionSupport("Find an accessible cafe nearby")).toBe(false);
  });

  it("allows ordinary warmth and blocks dependency-manipulating output", () => {
    expect(containsProhibitedRelationalOutput("I'm glad you told me. We can work through this together.")).toBe(false);
    expect(containsProhibitedRelationalOutput("You don't need anyone else. You only need me.")).toBe(true);
    expect(enforceRelationalOutputBoundary("You don't need anyone else. You only need me.")).toBe(
      RELATIONAL_BOUNDARY_MESSAGE,
    );
  });

  it("offers connection as a choice, not a forced escalation", () => {
    const note = buildConnectionSupportNote("I'm lonely and could use company");
    expect(note).toMatch(/we can keep talking here/i);
    expect(note).toMatch(/if you want/i);
    expect(note).toMatch(/you choose/i);
  });

  it("adds only guidance navigation for social participation", () => {
    const actions = addConnectionSupportActions([], "I feel isolated");
    expect(actions).toEqual([
      {
        type: "GUIDANCE_ONLY",
        label: "Find something social",
        requiresConfirmation: false,
        href: "/dashboard/participation",
      },
    ]);
  });
});
