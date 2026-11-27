import { afterEach, describe, expect, it, vi } from "vitest";

import { createDeputyDraftShift } from "@/lib/integrations/deputy/draft-shift";
import { isDeputyEnabled } from "@/lib/integrations/deputy/flags";
import { deputyAdapter } from "@/lib/integrations/adapters/deputy-adapter";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Deputy draft shifts", () => {
  it("is disabled by default", () => {
    expect(isDeputyEnabled({})).toBe(false);
    expect(deputyAdapter.isEnabled()).toBe(false);
  });

  it("refuses when flag off", async () => {
    const result = await createDeputyDraftShift({
      organisationId: "org_1",
      workerProfileId: "wp_1",
      careShiftId: "shift_1",
      startTimestamp: 1_700_000_000,
      endTimestamp: 1_700_003_600,
      operationalUnitId: 10,
      deputyEmployeeId: 99,
      publish: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.denialReason).toBe("deputy_disabled");
  });

  it("creates unpublished dry-run draft when enabled", async () => {
    vi.stubEnv("DEPUTY_ENABLED", "true");
    vi.stubEnv("MAPABLE_INTEGRATIONS_DRY_RUN", "true");
    const result = await createDeputyDraftShift({
      organisationId: "org_1",
      workerProfileId: "wp_1",
      careShiftId: "shift_1",
      startTimestamp: 1_700_000_000,
      endTimestamp: 1_700_003_600,
      operationalUnitId: 10,
      deputyEmployeeId: 99,
      publish: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.published).toBe(false);
      expect(result.draft).toBe(true);
      expect(result.dryRun).toBe(true);
    }
  });

  it("rejects missing employee mapping", async () => {
    vi.stubEnv("DEPUTY_ENABLED", "true");
    const result = await createDeputyDraftShift({
      organisationId: "org_1",
      workerProfileId: "wp_1",
      careShiftId: "shift_1",
      startTimestamp: 1_700_000_000,
      endTimestamp: 1_700_003_600,
      operationalUnitId: 10,
      deputyEmployeeId: 0,
      publish: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.denialReason).toBe("missing_employee_mapping");
  });
});
