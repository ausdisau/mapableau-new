import { afterEach, describe, expect, it } from "vitest";

import {
  __resetMissionQueueForTests,
  enqueueMissionDraft,
} from "@/lib/access/missions/offline-queue";
import { missionToOdkForm } from "@/lib/integrations/access/odk/schemas";

describe("access missions offline draft", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_ACCESS_MISSIONS_ENABLED;
    __resetMissionQueueForTests();
  });

  it("queues offline draft with idempotency", () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_ACCESS_MISSIONS_ENABLED = "true";

    const mission = enqueueMissionDraft({
      title: "CBD survey",
      questIds: ["entrance.step_free", "lift.operating"],
      actorRef: "actor-1",
      idempotencyKey: "mission-idem-1",
    });
    expect(mission.status).toBe("queued_offline");
    expect(mission.tasks.length).toBe(2);

    expect(() =>
      enqueueMissionDraft({
        title: "CBD survey",
        questIds: ["entrance.step_free"],
        actorRef: "actor-1",
        idempotencyKey: "mission-idem-1",
      }),
    ).toThrow(/Duplicate/);
  });

  it("exports ODK form schema boundary", () => {
    const form = missionToOdkForm({
      id: "m-1",
      title: "Test",
      tasks: [{ questId: "entrance.step_free", label: "Step free?" }],
    });
    expect(form.formId).toBe("mapable_mission_m-1");
    expect(form.fields.some((f) => f.name === "quest_entrance.step_free")).toBe(
      true,
    );
  });
});
