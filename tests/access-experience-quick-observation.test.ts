import { describe, expect, it, vi } from "vitest";

import { accessExperienceFlags } from "@/lib/access/experience/flags";

vi.mock("@/lib/access/map/access-place-service", () => ({
  reportAccessPlace: vi.fn().mockResolvedValue({ id: "report-1" }),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/access/infrastructure/observation-service", () => ({
  createAccessObservation: vi.fn().mockResolvedValue({ id: "obs-1" }),
}));

vi.mock("@/lib/access/infrastructure/flags", () => ({
  accessInfrastructureFlags: {
    graphApisEnabled: false,
  },
}));

describe("quick observation service", () => {
  it("is blocked when Access Experience flag is off", async () => {
    delete process.env.MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED;
    const { submitQuickObservation } = await import(
      "@/lib/access/experience/quick-observation-service"
    );
    await expect(
      submitQuickObservation({
        placeId: "demo-parramatta-library",
        reporterId: "user-1",
        observationType: "lift_unavailable",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("creates place report evidence when graph APIs disabled", async () => {
    process.env.MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED = "true";
    expect(accessExperienceFlags.enabled).toBe(true);

    const { submitQuickObservation } = await import(
      "@/lib/access/experience/quick-observation-service"
    );
    const { reportAccessPlace } = await import("@/lib/access/map/access-place-service");

    const result = await submitQuickObservation({
      placeId: "demo-parramatta-library",
      reporterId: "user-1",
      observationType: "ramp_blocked",
      note: "Temporary barrier",
    });

    expect(result.channel).toBe("place_report");
    expect(reportAccessPlace).toHaveBeenCalled();
    delete process.env.MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED;
  });
});
