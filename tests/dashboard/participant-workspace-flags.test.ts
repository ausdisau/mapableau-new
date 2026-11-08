import { afterEach, describe, expect, it } from "vitest";

import { participantWorkspaceFlags } from "@/lib/config/participant-workspace";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("participant workspace flags", () => {
  it("defaults sidebar on and AI off", () => {
    delete process.env.MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR;
    delete process.env.MAPABLE_PARTICIPANT_MY_DAY_AI_ENABLED;
    expect(participantWorkspaceFlags.sidebarEnabled({})).toBe(true);
    expect(participantWorkspaceFlags.aiAssistedViewEnabled({})).toBe(false);
  });

  it("allows sidebar opt-out", () => {
    expect(
      participantWorkspaceFlags.sidebarEnabled({
        MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR: "false",
      }),
    ).toBe(false);
  });
});
