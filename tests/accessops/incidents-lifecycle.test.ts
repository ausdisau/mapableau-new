import { describe, expect, it } from "vitest";

import { canTransitionIncident } from "@/lib/accessops/incidents/incident-state-machine";

describe("AccessOps incident lifecycle", () => {
  it("allows acknowledge from reported", () => {
    expect(canTransitionIncident("reported", "acknowledged")).toBe(true);
  });

  it("does not close restored pending verification directly", () => {
    expect(canTransitionIncident("restored_pending_verification", "closed")).toBe(false);
  });
});
