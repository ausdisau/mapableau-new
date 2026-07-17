import { describe, expect, it } from "vitest";

import { SPECIALIST_MANIFESTS } from "@/lib/aura/agents/manifests";
import { SPECIALIST_AGENT_SLUGS } from "@/lib/aura/agents/registry";

describe("AURA AccessOps manifest", () => {
  it("is registered and prohibits unsafe actions", () => {
    expect(SPECIALIST_AGENT_SLUGS).toContain("accessops");
    const manifest = SPECIALIST_MANIFESTS.find((item) => item.slug === "accessops");
    expect(manifest?.prohibitedActionSlugs).toContain("accessops.actuate_infrastructure");
    expect(manifest?.prohibitedActionSlugs).toContain("accessops.expose_participant_profile");
  });
});
