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
    const emptyEnv = {} as unknown as NodeJS.ProcessEnv;
    expect(participantWorkspaceFlags.sidebarEnabled(emptyEnv)).toBe(true);
    expect(participantWorkspaceFlags.aiAssistedViewEnabled(emptyEnv)).toBe(
      false,
    );
  });

  it("allows sidebar opt-out", () => {
    expect(
      participantWorkspaceFlags.sidebarEnabled({
        MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR: "false",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});
